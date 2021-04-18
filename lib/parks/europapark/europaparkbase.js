import fetch from 'node-fetch';
import {scheduleType, entityType, queueType, fastPassStatus} from '../types.js';
import {Park} from '../park.js';
import moment from 'moment-timezone';
import Blowfish from 'egoroof-blowfish';
import crypto from 'crypto';

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
    options.cachepoistime = process.env.CACHE_DURATION_POIS;
    options.apiBase = process.env.EUROPAPARK_APIBASE;
    options.loginurl = process.env.EUROPAPARK_LOGIN;
    options.fbAppId = process.env.EUROPAPARK_FBAPPID;
    options.fbApiKey = process.env.EUROPAPARK_FBAPIKEY;
    options.fbProjectId = process.env.EUROPAPARK_FBPROJECTID;
    options.encKey = process.env.EUROPAPARK_ENCKEY;
    options.encIV = process.env.EUROPAPARK_ENCIV;

    // Languages
    options.languages = process.env.LANGUAGES;

    options.langoptions = `{'en', 'nl', 'de', 'fr'}`; // Accidentally found that EP provides Dutch data, lmao EDIT: IT'S NEXT LEVEL HORRIBLE, DON'T EVER ENABLE IT!

    super(options);

    // Check for existance
    if (!this.config.apiBase) throw new Error('Missing Europa-Park apiBase!');
    if (!this.config.loginurl) throw new Error('Missing Europa-Park Login URL!');
    if (!this.config.fbAppId) throw new Error('Missing Europa-Park firebase app id!');
    if (!this.config.fbApiKey) throw new Error('Missing Europa-Park api key!');
    if (!this.config.fbProjectId) throw new Error('Missing Europa-Park firebase project id!');
    if (!this.config.encKey) throw new Error('Missing Europa-Park enc key!');
    if (!this.config.encIV) throw new Error('Missing Europa-Park enciv!');
    if (!this.config.languages) {
      this.config.languages = 'en';
    };
    if (!this.config.cachepoistime) {
      this.config.cachepoistime = '12';
    };

    this.bf = new Blowfish(this.config.encKey, Blowfish.MODE.CBC, Blowfish.PADDING.PKCS5 );
    this.bf.setIv(this.config.encIV);
  }

  /**
   * Get or generate a Firebase device ID
   */
  async getFirebaseID() {
    return await this.cache.wrap('fid', async () => {
      try {
        const fidByteArray = crypto.randomBytes(17).toJSON().data;
        fidByteArray[0] = 0b01110000 + (fidByteArray[0] % 0b00010000);
        const b64String = Buffer.from(String.fromCharCode(...fidByteArray))
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
        const fid = b64String.substr(0, 22);
        return /^[cdef][\w-]{21}$/.test(fid) ? fid : '';
      } catch (e) {
        this.emit('error', e);
        console.log(e);
        return '';
      }
    }, 1000 * 60 * 60 * 24 * 8); // 8 days DON'T CHANGE
  }

  /**
   * Get Europa Park config keys
   */
  async getConfig() {
    return await this.cache.wrap('auth', async () => {
      const fid = await this.getFirebaseID();

      return fetch(
          `https://firebaseremoteconfig.googleapis.com/v1/projects/${this.config.fbProjectId}/namespaces/firebase:fetch`,
          {
            method: 'POST',
            headers: {
              'X-Goog-Api-Key': this.config.fbApiKey,
            },
            body: JSON.stringify({
              'appInstanceId': fid,
              'appId': this.config.fbAppId,
              'packageName': 'com.EuropaParkMackKG.EPGuide',
              'languageCode': 'en_GB',
            }),
          },
      )
          .then((res) => res.json())
          .then((resp) => {
            const decrypt = (str) => {
              return this.bf.decode(Buffer.from(str, 'base64'), Blowfish.TYPE.STRING);
            };
            return {
              client_id: decrypt(resp.entries.v3_live_android_exozet_api_username),
              client_secret: decrypt(resp.entries.v3_live_android_exozet_api_password),
              grant_type: 'client_credentials',
            };
          });
    }, 1000 * 60 * 60 * 6); // 6 hours, DON'T CHANGE
  }

  /**
  * Login to EuropaPark API
  * Calling this method too fast can cause a perm block from the Macks
  * @return {string} EuropaPark JWT token
  */
  async loginEP() {
    const auth = await this.getConfig();
    return fetch(this.config.loginurl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(auth),
        },
    )
        .then((res) => res.json())
        .then((login) => {
          const jwttoken = 'Bearer ' + login.access_token;
          return Promise.resolve(jwttoken);
        });
  }

  /**
  * Get All POIS of EuropaPark park
  * This data contains all the POIS in EuropaPark
  * @return {string} EP POIS without queues
  */
  async getPOIS() {
    return await this.cache.wrap('poidata', async () => {
      const jwttoken = await this.loginEP();

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
    }, 1000 * 60 * 60 * this.config.cachepoistime );  
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

      if (!poiData) throw new Error('No PoiData for EuropaPark found!'); // API probably died, nothing new. Stay calm

      const poi = {};
      let singleRider = false; // EP doesn't send these values
      let fastPass = false; // Set fastpass to false as default
      let isVirtQueue = false; // Default poi isn't a virtqueue
      poiData.pois.forEach((ride) => {
        if (ride.type === 'attraction' && ride.code !== null && ride.scopes.indexOf(`${this.config.parkId}`) === 0) { // Return rides and pois which haven't null
          if (ride.name.indexOf('Queue - ') === 0) return; // Ignore the Queue Pointers, really, why do they even exist?
          if (ride.name.indexOf('VirtualLine: ') === 0) { // So EP reports virtlane as seperate map pointer, they send it as a stand-alone POI, assign the VirtQueue tag here.
            fastPass = true;
            isVirtQueue = true;
            const paren = ride.name.slice(13);
            parent = paren;
            singleRider = true; // VirtLines are the SRL replacement
          } else { // Yay, it's not a Virtline entry!
            fastPass = false;
            isVirtQueue = false;
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
            area = `Grimm's Fairytale Forest`; // Thanks for the single quote. Really helpful indeed
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
            minHeight = ride.minHeight; // Minimum length
          };
          if (ride.minHeightAdult) {
            minHeightAccompanied = ride.minHeightAdult; // Minimum length accompanied, although, that's my guess
          };
          if (ride.minAge) {
            minAge = ride.minAge; // RECOMMENDED minimum age. 
          };
          if (ride.minAgeAdult) {
            minAgeAccompanied = ride.minAgeAdult; // The most epic entry every, a recommended minimum age whenever you're accompanied!!! Wow
          };
          if (ride.maxHeight) {
            maxHeight = ride.maxHeight; // Some people wants to grow like 3m high and that has to stop.
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
    }, 1000 * 60 * 60 * this.config.cachepoistime );
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

          // Build the static object - probably the only thing that'll ever appear here are fairytales and the macks house, not kidding, its listed
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
    }, 1000 * 60 * 60 * this.config.cachepoistime );
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
    }, 1000 * 60 * 60 * this.config.cachepoistime );
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
    }, 1000 * 60 * 60 * this.config.cachepoistime );
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
    }, 1000 * 60 * 60 * this.config.cachepoistime );
  };

  /**
  * Get All Queues of EuropaPark park
  * This data contains all the Queues in EuropaPark park, attached with pois above.
  * @return {string} EP POIS with queues
  */
  async getQueue() {
    const token = await this.loginEP();
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
            if (ridetime.time > 0 && ridetime.time < 91) { // Ride is open and there is a queuetime available
              waitTime = ridetime.time;
              state = queueType.operating;
              active = true;
            } else if (ridetime.time === 91) { // Ride is open and queue is over 90 min, basically stupidly long
              waitTime = 91;
              state = queueType.operating;
              active = true;
            } else if (ridetime.time === 333) { // Ride is closed
              waitTime = 0;
              state = queueType.closed;
              active = false;
            } else if (ridetime.time === 666) { // FastPass is temporarily full, will reopen at a later time
              waitTime = 0;
              state = fastPassStatus.temporarilyFull;
              active = false;
            } else if (ridetime.time === 777) { // FastPass is full, won't reopen at a later time
              waitTime = 0;
              state = fastPassStatus.finished;
              active = false;
            } else if (ridetime.status === 444 || ridetime.time === 555 || ridetime.time === 999) { // Ride is down (down / ice / weather)
              waitTime = 0;
              state = queueType.down;
              active = false;
            } else if (ridetime.time === 222) { // Ride is in maintenance (startup sequence is listed as maint as well lol)
              waitTime = 0;
              state = queueType.refurbishment;
              active = false;
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
    const token = await this.loginEP();

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
