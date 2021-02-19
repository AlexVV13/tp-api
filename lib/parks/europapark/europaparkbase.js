import fetch from 'node-fetch';
import {scheduleType, entityType, queueType, fastPassStatus} from '../types.js';
import {Park} from '../park.js';
import moment from 'moment-timezone';

import dotenv from 'dotenv';
dotenv.config();

/**
* EuropaPark Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* NOTE: Dutch language is supported, however strange things occur, such as deletion of VirtualLine entries making rides appear twice as 'normal'
*
* This class contains some login and refresh functions, but NEVER call them if you don't need them.
* Most park specific parameters are set already
* @class
*/
export class EuropaParkBase extends Park {
  /**
  * Create a new EuropaPark Park object
  * @param {object} options
  */
  constructor(options = {}) {
    // API options
    options.apiBase = process.env.EUROPAPARK_APIBASE;
    options.credentials = process.env.EUROPAPARK_LOGINSTRING;
    options.loginurl = process.env.EUROPAPARK_LOGIN;
    options.refresh = process.env.EUROPAPARK_REFRESH;

    // Languages
    options.languages = process.env.LANGUAGES;

    options.langoptions = `{'en', 'nl', 'de', 'fr'}`; // Accidentally found that EP provides Dutch data, lmao

    super(options);

    // Check for existance
    if (!this.config.apiBase) throw new Error('Missing Europa-Park apiBase!');
    if (!this.config.credentials) throw new Error('Missing Europa-Park credentials!');
    if (!this.config.loginurl) throw new Error('Missing Europa-Park Login URL!');
    if (!this.config.refresh) throw new Error('Missing Europa-Park Refresh URL!');
    if (!this.config.languages) {
      this.config.languages = 'en';
    };
  }

  /**
  * Login to EuropaPark API
  * NEVER call this method without calling refresh() or getPOIS()!
  * Calling this method too fast can cause a perm block from the Macks
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.EuropaPark();
  *
  * park.loginEP().then((token) => {
  * console.log(token)
  * });
  * @return {string} EuropaPark refresh token
  */
  async loginEP() {
    return fetch(this.config.apiBase +
      this.config.loginurl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: this.config.credentials,
    },
    )
        .then((res) => res.json())
        .then((login) => {
          const refreshtoken = {'refresh_token': login.refresh_token};
          return Promise.resolve(refreshtoken);
        });
  }

  /**
  * Refresh your just obtained ep token
  * Tokens are 6 hrs valid, however there's no point in just calling this function without queues or sth else
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.EuropaPark();
  *
  * park.refreshEP().then((token) => {
  * console.log(token)
  * });
  * @return {string} EuropaPark JWT Token
  */
  async refreshEP() {
    return await this.cache.wrap('jwttoken', async () => {
      return await this.loginEP().then((refreshtoken) => fetch(this.config.apiBase +
        this.config.refresh,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refreshtoken),
      },
      )
          .then((res) => res.json())
          .then((jwt) => {
            const jwttoken = 'Bearer ' + jwt.token;
            return Promise.resolve(jwttoken);
          }),
      );
    }, 1000 * 60 * 60 * 6); // 6 hours
  };

  /**
  * Get All POIS of EuropaPark park
  * This data contains all the POIS in EuropaPark
  * @return {string} EP POIS without queues
  */
  async getPOIS() {
    return await this.cache.wrap('poidata', async () => {
      const jwttoken = await this.refreshEP();

      return fetch(this.config.apiBase +
        `pois/${this.config.languages}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'JWTAuthorization': jwttoken,
        },
      },
      )
          .then((res) => res.json())
          .then((rideData) => {
            return Promise.resolve(rideData); // Immediately return rideData, no need to fetch anything else here because their API is shit.
          });
    }, 1000 * 60 * 60 * 12 /* cache for 12 hours */);
  };

  /**
  * Build EuropaPark park ride object
  * This data contains general ride names, descriptions etc.
  * @return {string} All EuropaPark park ride POIS without queuetimes
  */
  async buildRidePOI() {
    let parent = null;
    return await this.cache.wrap(`${this.config.parkId}-ridedata`, async () => { // Rebuilding the ride object each time is SLOOOOOWWWW
      const poiData = await this.getPOIS(); // Get the POI Data

      if (!poiData) throw new Error('No PoiData for EuropaPark found!');

      const poi = {};
      let singleRider = 'false'; // EP doesn't send these values
      let fastPass = 'false'; // Set fastpass to false as default
      let isVirtQueue = 'false'; // Default poi isn't a virtqueue
      poiData.pois.forEach((ride) => {
        if (ride.type === 'attraction' && ride.code !== null && ride.scopes.indexOf(`${this.config.parkId}`) === 0) { // Return rides and pois which haven't null
          if (ride.name.indexOf('Queue - ') === 0) return; // Ignore the Queue Pointers, really, why do they even exist?
          if (ride.name.indexOf('VirtualLine: ') === 0) { // So EP reports virtlane as seperate map pointer, they send it as a stand-alone POI, assign the VirtQueue tag here.
            fastPass = 'true';
            isVirtQueue = 'true';
            const paren = ride.name.slice(13);
            parent = paren;
            singleRider = 'true'; // VirtLines are the SRL replacement
          } else { // Yay, it's not a Virtline entry!
            fastPass = 'false';
            isVirtQueue = 'false';
            parent = null;
          }
          let area = 'Germany'; // Really, this is the strangest empire thing ever
          if (ride.areaId == 10) {
            area = 'Adventureland';
          } else if (ride.areaId == 11) {
            area = 'Kingdom of the Minimoys';
          } else if (ride.areaId == 12) {
            area = 'Germany';
          } else if (ride.areaId == 13) {
            area = 'England';
          } else if (ride.areaId == 14) {
            area = 'France';
          } else if (ride.areaId == 15) {
            area = 'Greece';
          } else if (ride.areaId == 16) {
            area = `Grimm's Fairytale Forest`;
          } else if (ride.areaId == 17) {
            area = 'Netherlands';
          } else if (ride.areaId == 19) {
            area = 'Ireland';
          } else if (ride.areaId == 20) {
            area = 'Iceland';
          } else if (ride.areaId == 21) {
            area = 'Italy';
          } else if (ride.areaId == 22) {
            area = 'Luxembourg';
          } else if (ride.areaId == 23) {
            area = 'Austria';
          } else if (ride.areaId == 24) {
            area = 'Portugal';
          } else if (ride.areaId == 25) {
            area = 'Russia';
          } else if (ride.areaId == 26) {
            area = 'Switzerland';
          } else if (ride.areaId == 27) {
            area = 'Scandinavia';
          } else if (ride.areaId == 28) {
            area = 'Spain';
          }
          // To be clear, there are even more areas, but yeah, useless.

          // EuropaPark actually provides some cool tags which I'll attach here.
          let Producer = undefined;
          let Opening = undefined;
          let Capacity = undefined;
          let Ridetime = undefined;
          let TheoreticalCapacity = undefined;
          let MaxGForce = undefined;
          let MaxSpeed = undefined;
          let Height = undefined;

          if (ride.attributes) {
            Object.keys(ride.attributes).forEach((poiat) => {
              if (ride.attributes[poiat].key === 'Producer') {
                Producer = ride.attributes[poiat].value;
              } else if (ride.attributes[poiat].key === 'Opening') {
                Opening = ride.attributes[poiat].value;
              } else if (ride.attributes[poiat].key === 'Capacity') {
                Capacity = ride.attributes[poiat].value;
              } else if (ride.attributes[poiat].key === 'Driving Time') {
                Ridetime = ride.attributes[poiat].value;
              } else if (ride.attributes[poiat].key === 'Theoretical Capacity') {
                TheoreticalCapacity = ride.attributes[poiat].value;
              } else if (ride.attributes[poiat].key === 'Max Acceleration') {
                MaxGForce = ride.attributes[poiat].value;
              } else if (ride.attributes[poiat].key === 'Max Speed') {
                MaxSpeed = ride.attributes[poiat].value;
              } else if (ride.attributes[poiat].key === 'Height') {
                Height = ride.attributes[poiat].value;
              }
            });
          }

          const tags = {
            Producer,
            Opening,
            Capacity,
            Ridetime,
            TheoreticalCapacity,
            MaxGForce,
            MaxSpeed,
            Height,
          };

          // And some restrictions.
          let minHeight = undefined;
          let minHeightAccompanied = undefined;
          let minAge = undefined;
          let minAgeAccompanied = undefined;
          let maxHeight = undefined;
          if (ride.minHeight) {
            minHeight = ride.minHeight;
          };
          if (ride.minHeightAdult) {
            minHeightAccompanied = ride.minHeightAdult;
          };
          if (ride.minAge) {
            minAge = ride.minAge;
          };
          if (ride.minAgeAdult) {
            minAgeAccompanied = ride.minAgeAdult;
          };
          if (ride.maxHeight) {
            maxHeight = ride.maxHeight;
          }

          const restrictions = {
            minHeight,
            minHeightAccompanied,
            minAge,
            minAgeAccompanied,
            maxHeight,
          };

          // Build the ride object
          poi[ride.code] = {
            name: ride.name,
            id: `${this.config.name}_` + ride.code,
            waitTime: null,
            state: null,
            active: null,
            location: {
              area: area,
              latitude: ride.latitude,
              longitude: ride.longitude,
            },
            meta: {
              description: ride.description,
              short_description: ride.excerpt,
              single_rider: singleRider,
              fastPass: fastPass,
              parent: parent,
              type: entityType.ride,
              single_rider: singleRider,
              isVirtQueue: isVirtQueue,
              tags: tags,
              restrictions: restrictions,
            },
          };
        };
      });
      return Promise.resolve(poi);
    }, 1000 * 60 * 60 * 12 /* cache for 12 hours */);
  };

  /**
  * Build EuropaPark park static object
  * This data contains general ride names, descriptions etc.
  * @return {string} All EuropaPark park static POIS without queuetimes
  */
  async buildStaticPOI() {
    return await this.cache.wrap(`${this.config.parkId}-static`, async () => { // Rebuilding the ride object each time is SLOOOOOWWWW
      const poiData = await this.getPOIS(); // Get the POI Data

      if (!poiData) throw new Error('No PoiData for EuropaPark found!');

      const poi = {};
      poiData.pois.forEach((ride) => {
        if (ride.type === 'sight' && ride.code !== null && ride.scopes.indexOf(`${this.config.parkId}`) === 0) { // Return rides and pois which haven't null
          if (ride.name.indexOf('Queue - ') === 0) return; // Ignore the Queue Pointers
          let area = 'Germany'; // Really, this is the strangest empire thing ever
          if (ride.areaId == 10) {
            area = 'Adventureland';
          } else if (ride.areaId == 11) {
            area = 'Kingdom of the Minimoys';
          } else if (ride.areaId == 12) {
            area = 'Germany';
          } else if (ride.areaId == 13) {
            area = 'England';
          } else if (ride.areaId == 14) {
            area = 'France';
          } else if (ride.areaId == 15) {
            area = 'Greece';
          } else if (ride.areaId == 16) {
            area = `Grimm's Fairytale Forest`;
          } else if (ride.areaId == 17) {
            area = 'Netherlands';
          } else if (ride.areaId == 19) {
            area = 'Ireland';
          } else if (ride.areaId == 20) {
            area = 'Iceland';
          } else if (ride.areaId == 21) {
            area = 'Italy';
          } else if (ride.areaId == 22) {
            area = 'Luxembourg';
          } else if (ride.areaId == 23) {
            area = 'Austria';
          } else if (ride.areaId == 24) {
            area = 'Portugal';
          } else if (ride.areaId == 25) {
            area = 'Russia';
          } else if (ride.areaId == 26) {
            area = 'Switzerland';
          } else if (ride.areaId == 27) {
            area = 'Scandinavia';
          } else if (ride.areaId == 28) {
            area = 'Spain';
          }

          // EuropaPark actually provides some cool tags which I'll attach here.
          let producer = null;
          let opening = null;
          let capacity = null;
          let ridetime = null;
          let thcapacity = null;
          let gforce = null;
          let maxspeed = null;
          let height = null;

          if (ride.attributes) {
            Object.keys(ride.attributes).forEach((poiat) => {
              if (ride.attributes[poiat].key === 'Producer') {
                producer = ride.attributes[poiat].value;
              } else if (ride.attributes[poiat].key === 'Opening') {
                opening = ride.attributes[poiat].value;
              } else if (ride.attributes[poiat].key === 'Capacity') {
                capacity = ride.attributes[poiat].value;
              } else if (ride.attributes[poiat].key === 'Driving Time') {
                ridetime = ride.attributes[poiat].value;
              } else if (ride.attributes[poiat].key === 'Theoretical Capacity') {
                thcapacity = ride.attributes[poiat].value;
              } else if (ride.attributes[poiat].key === 'Max Acceleration') {
                gforce = ride.attributes[poiat].value;
              } else if (ride.attributes[poiat].key === 'Max Speed') {
                maxspeed = ride.attributes[poiat].value;
              } else if (ride.attributes[poiat].key === 'Height') {
                height = ride.attributes[poiat].value;
              }
            });
          }

          // And some restrictions.
          let minHeight = null;
          let minHeightAdult = null;
          let minAge = null;
          let minAgeAdult = null;
          let maxHeight = null;
          if (ride.minHeight) {
            minHeight = ride.minHeight;
          };
          if (ride.minHeightAdult) {
            minHeightAdult = ride.minHeightAdult;
          };
          if (ride.minAge) {
            minAge = ride.minAge;
          };
          if (ride.minAgeAdult) {
            minAgeAdult = ride.minAgeAdult;
          };
          if (ride.maxHeight) {
            maxHeight = ride.maxHeight;
          }

          // Build the static object
          poi[ride.code] = {
            name: ride.name,
            id: `${this.config.name}_` + ride.code,
            location: {
              area: area,
              latitude: ride.latitude,
              longitude: ride.longitude,
            },
            meta: {
              description: ride.description,
              short_description: ride.excerpt,
              type: entityType.static,
              tags: {
                Producer: producer,
                Capacity: capacity,
                Opened: opening,
                Duration: ridetime,
                Theoretical_Capacity: thcapacity,
                Max_GForce: gforce,
                Max_Speed: maxspeed,
                Height: height,
              },
              restrictions: {
                minHeight: minHeight,
                minHeightAccompanied: minHeightAdult,
                maxHeight: maxHeight,
                minAge: minAge,
                minAgeAccompanied: minAgeAdult,
              },
            },
          };
        };
      });
      return Promise.resolve(poi);
    }, 1000 * 60 * 60 * 12 /* cache for 12 hours */);
  };

  /**
  * Build EuropaPark park restaurant object
  * This data contains general restaurant names, descriptions etc.
  * @return {string} All EP park restaurant POIS
  */
  async buildRestaurantPOI() {
    return await this.cache.wrap(`${this.config.parkId}-restpoi`, async () => { // Rebuilding the ride object each time is SLOOOOOWWWW
      const poiData = await this.getPOIS(); // Get the POI Data

      if (!poiData) throw new Error('No PoiData for EuropaPark found!');

      const poi = {};
      poiData.pois.forEach((ride) => {
        if (ride.type === 'gastronomy' && ride.code !== null && ride.scopes.indexOf(`${this.config.parkId}`) === 0) { // Return rides and pois which haven't null
          let area = undefined; // Default, Hotel is included as well which adds new areas
          if (ride.areaId == 10) {
            area = 'Adventureland';
          } else if (ride.areaId == 11) {
            area = 'Kingdom of the Minimoys';
          } else if (ride.areaId == 12) {
            area = 'Germany';
          } else if (ride.areaId == 13) {
            area = 'England';
          } else if (ride.areaId == 14) {
            area = 'France';
          } else if (ride.areaId == 15) {
            area = 'Greece';
          } else if (ride.areaId == 17) {
            area = 'Netherlands';
          } else if (ride.areaId == 19) {
            area = 'Ireland';
          } else if (ride.areaId == 20) {
            area = 'Iceland';
          } else if (ride.areaId == 21) {
            area = 'Italy';
          } else if (ride.areaId == 22) {
            area = 'Luxembourg';
          } else if (ride.areaId == 23) {
            area = 'Austria';
          } else if (ride.areaId == 24) {
            area = 'Portugal';
          } else if (ride.areaId == 25) {
            area = 'Russia';
          } else if (ride.areaId == 26) {
            area = 'Switzerland';
          } else if (ride.areaId == 27) {
            area = 'Scandinavia';
          } else if (ride.areaId == 28) {
            area = 'Spain';
          }

          // Build the restaurant object
          poi[ride.code] = {
            name: ride.name,
            id: `${this.config.name}_` + ride.code,
            location: {
              area: area,
              latitude: ride.latitude,
              longitude: ride.longitude,
            },
            meta: {
              description: ride.description,
              short_description: ride.excerpt,
              type: entityType.restaurant,
            },
          };
        };
      });
      return Promise.resolve(poi);
    }, 1000 * 60 * 60 * 12 /* cache for 12 hours */);
  };

  /**
  * Build EuropaPark park Merchandise object
  * This data contains general merchandise names, descriptions etc.
  * @return {string} All EP park Merchandise POIS
  */
  async buildMerchandisePOI() {
    return await this.cache.wrap(`${this.config.parkId}-merchpoi`, async () => { // Rebuilding the ride object each time is SLOOOOOWWWW
      const poiData = await this.getPOIS(); // Get the POI Data

      if (!poiData) throw new Error('No PoiData for EuropaPark found!');

      const poi = {};
      poiData.pois.forEach((ride) => {
        if (ride.type === 'shopping' && ride.code !== null && ride.scopes.indexOf(`${this.config.parkId}`) === 0) { // Return rides and pois which haven't null
          let area = undefined; // Default, Hotel is included as well which adds new areas
          if (ride.areaId == 10) {
            area = 'Adventureland';
          } else if (ride.areaId == 11) {
            area = 'Kingdom of the Minimoys';
          } else if (ride.areaId == 12) {
            area = 'Germany';
          } else if (ride.areaId == 13) {
            area = 'England';
          } else if (ride.areaId == 14) {
            area = 'France';
          } else if (ride.areaId == 15) {
            area = 'Greece';
          } else if (ride.areaId == 17) {
            area = 'Netherlands';
          } else if (ride.areaId == 19) {
            area = 'Ireland';
          } else if (ride.areaId == 20) {
            area = 'Iceland';
          } else if (ride.areaId == 21) {
            area = 'Italy';
          } else if (ride.areaId == 22) {
            area = 'Luxembourg';
          } else if (ride.areaId == 23) {
            area = 'Austria';
          } else if (ride.areaId == 24) {
            area = 'Portugal';
          } else if (ride.areaId == 25) {
            area = 'Russia';
          } else if (ride.areaId == 26) {
            area = 'Switzerland';
          } else if (ride.areaId == 27) {
            area = 'Scandinavia';
          } else if (ride.areaId == 28) {
            area = 'Spain';
          }

          // Build the merchandise object
          poi[ride.code] = {
            name: ride.name,
            id: `${this.config.name}_` + ride.code,
            location: {
              area: area,
              latitude: ride.latitude,
              longitude: ride.longitude,
            },
            meta: {
              description: ride.description,
              short_description: ride.excerpt,
              type: entityType.merchandise,
            },
          };
        };
      });
      return Promise.resolve(poi);
    }, 1000 * 60 * 60 * 12 /* cache for 12 hours */);
  };

  /**
  * Build EuropaPark park Service object
  * This data contains general service names, descriptions etc.
  * @return {string} All EP park Services POIS
  */
  async buildServicePOI() {
    return await this.cache.wrap(`${this.config.parkId}-servicedata`, async () => { // Rebuilding the ride object each time is SLOOOOOWWWW
      const poiData = await this.getPOIS(); // Get the POI Data

      if (!poiData) throw new Error('No PoiData for EuropaPark found!');

      const poi = {};
      poiData.pois.forEach((ride) => {
        if (ride.type === 'service' && ride.code !== null && ride.scopes.indexOf(`${this.config.parkId}`) === 0) { // Return rides and pois which haven't null
          let area = undefined; // Default, Hotel is included as well which adds new areas
          if (ride.areaId == 10) {
            area = 'Adventureland';
          } else if (ride.areaId == 11) {
            area = 'Kingdom of the Minimoys';
          } else if (ride.areaId == 12) {
            area = 'Germany';
          } else if (ride.areaId == 13) {
            area = 'England';
          } else if (ride.areaId == 14) {
            area = 'France';
          } else if (ride.areaId == 15) {
            area = 'Greece';
          } else if (ride.areaId == 17) {
            area = 'Netherlands';
          } else if (ride.areaId == 19) {
            area = 'Ireland';
          } else if (ride.areaId == 20) {
            area = 'Iceland';
          } else if (ride.areaId == 21) {
            area = 'Italy';
          } else if (ride.areaId == 22) {
            area = 'Luxembourg';
          } else if (ride.areaId == 23) {
            area = 'Austria';
          } else if (ride.areaId == 24) {
            area = 'Portugal';
          } else if (ride.areaId == 25) {
            area = 'Russia';
          } else if (ride.areaId == 26) {
            area = 'Switzerland';
          } else if (ride.areaId == 27) {
            area = 'Scandinavia';
          } else if (ride.areaId == 28) {
            area = 'Spain';
          }

          // Build the service object
          poi[ride.code] = {
            name: ride.name,
            id: `${this.config.name}_` + ride.code,
            location: {
              area: area,
              latitude: ride.latitude,
              longitude: ride.longitude,
            },
            meta: {
              description: ride.description,
              short_description: ride.excerpt,
              type: entityType.service,
            },
          };
        };
      });
      return Promise.resolve(poi);
    }, 1000 * 60 * 60 * 12 /* cache for 12 hours */);
  };

  /**
  * Get All Queues of EuropaPark park
  * This data contains all the Queues in EuropaPark park, attached with pois above.
  * @return {string} EP POIS with queues
  */
  async getQueue() {
    const token = await this.refreshEP();
    const rideData = await this.buildRidePOI();

    return fetch(this.config.apiBase +
      `waitingtimes`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'JWTAuthorization': token,
      },
    },
    )
        .then((res) => res.json())
        .then((poiData) => {
          const rides = [];
          poiData.waitingtimes.forEach((ridetime) => {
          // Declare default for rides that doesn't fetch right now
            let waitTime = null;
            let state = null;
            let active = null; // Accepting null as value, since some rides never will join the queue api because they simply never have a queue
            // However, setting '0' & state will set the ride all day closed, which isn't true obviously

            let returntime = undefined;
            if (ridetime.startAt) {
              returntime = {
                start: ridetime.startAt,
                end: ridetime.endAt,
              };
            } else {
              returntime = undefined;
            }

            // TO DO If ride isn't present in this api it just regrets it and returns nothing, however we at least want some tags.
            if (ridetime.time > 0 && ridetime.time < 91) {
              waitTime = ridetime.time;
              state = queueType.operating;
              active = 'true';
            } else if (ridetime.time === 91) {
              waitTime = 91;
              state = queueType.operating;
              active = 'true';
            } else if (ridetime.time === 333) {
              waitTime = 0;
              state = queueType.closed;
              active = 'false';
            } else if (ridetime.time === 666) {
              waitTime = 0;
              state = fastPassStatus.temporarilyFull;
              active = 'false';
            } else if (ridetime.time === 777) {
              waitTime = 0;
              state = fastPassStatus.finished;
              active = 'false';
            } else if (ridetime.status === 444 || ridetime.time === 555 || ridetime.time === 999) {
              waitTime = 0;
              state = queueType.down;
              active = 'false';
            } else if (ridetime.time === 222) {
              waitTime = 0;
              state = queueType.refurbishment;
              active = 'false';
            }

            if (rideData[ridetime.code]) { // Skip null variables
              rideData[ridetime.code].waitTime = waitTime;
              rideData[ridetime.code].state = state;
              rideData[ridetime.code].active = active;

              const rideobj = {
                name: rideData[ridetime.code].name,
                id: rideData[ridetime.code].id,
                waitTime: rideData[ridetime.code].waitTime,
                state: rideData[ridetime.code].state,
                active: rideData[ridetime.code].active,
                location: {
                  area: rideData[ridetime.code].location.area,
                  latitude: rideData[ridetime.code].location.latitude,
                  longitude: rideData[ridetime.code].location.longitude,
                },
                fastPass: {
                  returnTime: returntime,
                  isVirtQueue: rideData[ridetime.code].meta.isVirtQueue,
                  fastPass: rideData[ridetime.code].meta.fastPass,
                  parent: rideData[ridetime.code].meta.parent,
                },
                meta: {
                  descriptions: {
                    description: rideData[ridetime.code].meta.description,
                    short_description: rideData[ridetime.code].meta.short_description,
                  },
                  type: rideData[ridetime.code].meta.type,
                  single_rider: rideData[ridetime.code].meta.single_rider,
                  tags: rideData[ridetime.code].meta.tags,
                  restrictions: rideData[ridetime.code].meta.restrictions,
                },
              };
              rides.push(rideobj);
            }
          });
          return Promise.resolve(rides);
        });
  };

  /**
  * Get All Operating Hours of EuropaPark
  * This data contains all the Operating Hours in EuropaPark, fetched with currentyear.
  * @return {string} EP park hours
  */
  async getHours() {
    const token = await this.refreshEP();

    return fetch(
        this.config.apiBase +
          `seasons/en`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'JWTAuthorization': token,
          },
        },
    )
        .then((res) => res.json())
        .then((json) => {
          return Promise.resolve(json);
        });
  };

  /**
  * Get All Operating Hours of EuropaPark
  * This data contains all the Operating Hours in EuropaPark.
  * @return {string} EP park hours
  * @param {moment} date
  */
  async fetchHours(date) {
    const cal = await this.getHours();
    const parkTimes = cal.seasons.filter(
        // Filter hours in this really strange useless API.
        (x) => !x.closed && x.scopes.indexOf(this.config.parkId) >= 0,
    ).find(
        // Finding valid data
        (x) => date.isBetween(x.startAt, x.endAt, 'day'),
    );

    if (parkTimes !== undefined) {
      const times = [];

      const buildDateString = (inDate) => {
        return moment.tz(inDate, this.config.timezone).set({
          year: date.year(),
          month: date.month(),
          date: date.date(),
        }).format();
      };

      times.push({
        openingTime: buildDateString(parkTimes.startAt),
        closingTime: buildDateString(parkTimes.endAt),
        type: scheduleType.operating,
      });

      // EP provides Hotel Hours
      if (parkTimes.hotelStartAt && parkTimes.hotelEndAt) {
        times.push({
          openingTime: buildDateString(parkTimes.hotelStartAt),
          closingTime: buildDateString(parkTimes.hotelEndAt),
          type: scheduleType.extraHours,
          description: 'Open To Hotel Guests',
        });
      }

      return times;
    }

    return undefined;
  };

  /**
   * Get Operating Calendar for this park
   * @return{object} Object keyed to dates in YYYY-MM-DD format.
   * Each date entry will contain an array of operating hours.
   */
  async getOpHours() {
    try {
      // Populate the time object from yesterday on, plus 60 days from no
      const yesterday = this.getTimeNowMoment().subtract(1, 'days');

      const endFillDate = yesterday.clone().add(60 + 1, 'days');

      const now = this.getTimeNowMoment();

      const dates = {};
      // Loop over each day and populate the object with the data
      for (let date = yesterday; date.isSameOrBefore(endFillDate); date.add(1, 'day')) {
        const hours = await this.fetchHours(date);
        if (hours !== undefined) {
          if (!Array.isArray(hours)) {
            this.emit(
                'error',
                new Error(
                    `Hours for ${this.name} date ${date.format('YYYY-MM-DD')} returned invalid non-Array ${JSON.stringify(hours)}`,
                ),
            );
            continue;
          }
          // Ignore if times are from the past, since no one would need that
          const isInsideAnyDateHours = hours.find((h) => {
            return now.isBetween(h.openingTime, h.closingTime);
          });
          if (now.isAfter(date, 'day') && isInsideAnyDateHours === undefined) {
            continue;
          }
          dates[date.format('YYYY-MM-DD')] = hours;
        }
      }

      return dates;
    } catch (err) {
      console.error('Error getting calendar', err);
      this.emit('error', err);
    }

    // Nothing is returned, park is probably closed or sth.
    return undefined;
  };
}

export default EuropaParkBase;