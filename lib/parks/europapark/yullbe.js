import fetch from 'node-fetch';
import {entityType, queueType} from '../types.js';
import {Park} from '../park.js';

import dotenv from 'dotenv';
dotenv.config();

/**
* Rulantica Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* NOTE: Dutch language is supported, however strange things occur, such as deletion of VirtualLine entries making rides appear twice as 'normal'
*
* Context: YULLBE is a VR experience from EP which is installed over rides and TRAUMATICA, nothing too special, but listed as park :)
*
* This class contains some login and refresh functions, but NEVER call them if you don't need them.
* Most park specific parameters are set already
* @class
*/
export class Yullbe extends Park {
  /**
  * Create a new EuropaPark Park object
  * @param {object} options
  */
  constructor(options = {}) {
    options.name = 'YULLBE';
    options.timezone = 'Europe/Berlin';

    // Setting the parks entrance as latlon USING EP ENTRANCE SINCE YULLBE IS UNIVERSAL
    options.latitude = 48.266140769976715;
    options.longitude = 7.722050520358709;

    // Options for our park Object
    options.supportswaittimes = 'true';
    options.supportsschedule = 'false';
    options.supportsrideschedules = 'false';
    options.fastPass = 'true';
    options.FastPassReturnTimes = 'false';

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
  * const park = new tpapi.park.Yullbe();
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
  * const park = new tpapi.park.Yullbe();
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
  * Get All POIS of EuropaPark
  * This data contains all the POIS in EuropaPark
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Yullbe();
  *
  * park.getPois().then((pois) => {
  * console.log(pois)
  * });
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
  * Build Yullbe ride object
  * This data contains general ride names, descriptions etc.
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Yullbe();
  *
  * park.buildRidePOI().then((pois) => {
  * console.log(pois)
  * });
  * @return {string} All Yullbe ride POIS without queuetimes
  */
  async buildRidePOI() {
    return await this.cache.wrap('ridedata', async () => { // Rebuilding the ride object each time is SLOOOOOWWWW
      const poiData = await this.getPOIS(); // Get the POI Data

      if (!poiData) throw new Error('No PoiData for EuropaPark found!');

      const poi = {};
      poiData.pois.forEach((ride) => { // Data includes Yullbe, however, they're listed as slides, so not defining anything special here.
        if (ride.type === 'attraction' && ride.code !== null && ride.scopes.indexOf('yullbe') === 0) { // Return rides and pois which haven't null
          const area = 'Yullbe'; // Really, this is the strangest empire thing ever

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

          // Build the ride object
          poi[ride.code] = {
            name: ride.name,
            id: 'Yullbe_' + ride.code,
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
              type: entityType.ride,
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
  * Build Yullbe restaurant object
  * This data contains general restaurant names, descriptions etc.
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Yullbe();
  *
  * park.buildRidePOI().then((pois) => {
  * console.log(pois)
  * });
  * @return {string} All Yullbe restaurant POIS
  */
  async buildRestaurantPOI() {
    return await this.cache.wrap('restdata', async () => { // Rebuilding the ride object each time is SLOOOOOWWWW
      const poiData = await this.getPOIS(); // Get the POI Data

      if (!poiData) throw new Error('No PoiData for EuropaPark found!');

      const poi = {};
      poiData.pois.forEach((ride) => { // Data includes Yullbe, however, they're listed as slides, so not defining anything special here.
        if (ride.type === 'gastronomy' && ride.code !== null && ride.scopes.indexOf('yullbe') === 0) { // Return rides and pois which haven't null
          const area = 'Yullbe'; // Default, Hotel is included as well which adds new areas

          // Build the restaurant object
          poi[ride.code] = {
            name: ride.name,
            id: 'Yullbe_' + ride.code,
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
  * Build Yullbe Merchandise object
  * This data contains general merchandise names, descriptions etc.
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Yullbe();
  *
  * park.buildMerchandisePOI().then((pois) => {
  * console.log(pois)
  * });
  * @return {string} All Yullbe Merchandise POIS
  */
  async buildMerchandisePOI() {
    return await this.cache.wrap('merchdata', async () => { // Rebuilding the ride object each time is SLOOOOOWWWW
      const poiData = await this.getPOIS(); // Get the POI Data

      if (!poiData) throw new Error('No PoiData for EuropaPark found!');

      const poi = {};
      poiData.pois.forEach((ride) => { // Data includes Yullbe, however, they're listed as slides, so not defining anything special here.
        if (ride.type === 'shopping' && ride.code !== null && ride.scopes.indexOf('yullbe') === 0) { // Return rides and pois which haven't null
          const area = 'Yullbe'; // Default, Hotel is included as well which adds new areas

          // Build the merch object
          poi[ride.code] = {
            name: ride.name,
            id: 'Yullbe_' + ride.code,
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
  * Build Yullbe Service object
  * This data contains general service names, descriptions etc.
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Yullbe();
  *
  * park.buildServicePOI().then((pois) => {
  * console.log(pois)
  * });
  * @return {string} All Yullbe Services POIS
  */
  async buildServicePOI() {
    return await this.cache.wrap('servicedata', async () => { // Rebuilding the ride object each time is SLOOOOOWWWW
      const poiData = await this.getPOIS(); // Get the POI Data

      if (!poiData) throw new Error('No PoiData for EuropaPark found!');

      const poi = {};
      poiData.pois.forEach((ride) => {
        if (ride.type === 'service' && ride.code !== null && ride.scopes.indexOf('yullbe') === 0) { // Return rides and pois which haven't null
          const area = 'Yullbe'; // Default, Hotel is included as well which adds new areas

          // Build the service object
          poi[ride.code] = {
            name: ride.name,
            id: 'Yullbe_' + ride.code,
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
  * Get All Queues of Yullbe
  * This data contains all the Queues in Yullbe, attached with pois above.
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Yullbe();
  *
  * park.getQueue().then((queue) => {
  * console.log(queue)
  * });
  * @return {string} Yullbe POIS with queues
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

            // TO DO If ride isn't present in this api it just regrets it and returns nothing, however we at least want some tags.
            if (ridetime.time > 0 && ridetime.time < 91) {
              waitTime = ridetime.time;
              state = queueType.operating;
              active = 'true';
            } else if (ridetime.time === 91) {
              waitTime = 91;
              state = queueType.operating;
              active = 'true';
            } else if (ridetime.time === 333 || ridetime.time === 666 || ridetime.time === 777) {
              waitTime = 0;
              state = queueType.closed;
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
                meta: {
                  type: rideData[ridetime.code].meta.type,
                  isVirtQueue: rideData[ridetime.code].meta.isVirtQueue,
                  fastPass: rideData[ridetime.code].meta.fastPass,
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
  * Build YULLBE Service object
  * This data contains general service names, descriptions etc.
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Yullbe();
  *
  * park.buildServicePOI().then((pois) => {
  * console.log(pois)
  * });
  * @return {string} All YULLBE Services POIS
  */
  async buildServicePOI() {
    return await this.cache.wrap('servicedata', async () => { // Rebuilding the ride object each time is SLOOOOOWWWW
      const poiData = await this.getPOIS(); // Get the POI Data

      if (!poiData) throw new Error('No PoiData for EuropaPark found!');

      const poi = {};
      poiData.pois.forEach((ride) => {
        if (ride.type === 'service' && ride.code !== null && ride.scopes.indexOf('yullbe') === 0) { // Return rides and pois which haven't null
          const area = 'Yullbe'; // Default, Hotel is included as well which adds new areas

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

          // Build the service object
          poi[ride.code] = {
            name: ride.name,
            id: 'Yullbe_' + ride.code,
            location: {
              area: area,
              latitude: ride.latitude,
              longitude: ride.longitude,
            },
            meta: {
              description: ride.description,
              short_description: ride.excerpt,
              type: entityType.merchandise,
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
            },
          };
        };
      });
      return Promise.resolve(poi);
    }, 1000 * 60 * 60 * 12 /* cache for 12 hours */);
  };
};

export default Yullbe;
