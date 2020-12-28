import fetch from 'node-fetch';
import {Park} from '../park.js';

import dotenv from 'dotenv';
dotenv.config();

/**
* EuropaPark Park Object
*/
export class EuropaPark extends Park {
  /**
  * Create a new EuropaPark Park object
  * @param {object} options
  */
  constructor(options = {}) {
    options.name = options.name || 'Europa-Park';
    options.timezone = options.timezone || 'Europe/Berlin';

    // Setting the parks entrance as latlon
    options.latitude = 48.266140769976715;
    options.longitude = 7.722050520358709;

    options.apiBase = options.apiBase || process.env.EUROPAPARK_APIBASE;
    options.credentials = options.credentials || process.env.EUROPAPARK_LOGINSTRING;
    options.loginurl = options.loginurl || process.env.EUROPAPARK_LOGIN;
    options.refresh = options.refresh || process.env.EUROPAPARK_REFRESH;

    options.languages = options.languages || process.env.LANGUAGES;

    options.langoptions = options.langoptions || `{'en', 'de', 'fr'}`;

    super(options);

    if (!this.config.apiBase) throw new Error('Missing Europa-Park apiBase!');
    if (!this.config.credentials) throw new Error('Missing Europa-Park credentials!');
    if (!this.config.loginurl) throw new Error('Missing Europa-Park Login URL!');
    if (!this.config.refresh) throw new Error('Missing Europa-Park Refresh URL!');
    if (!this.config.languages) {
      this.config.languages = 'en';
    };
  }

  // Load the Europapark poidata
  // const poidata = ('./data/parks/europapark/europapark_pois.json')
  // const poimock = ('./data/parks/europapark/europapark_poi_mock.json')

  /**
  * Login to EuropaPark API
  * NEVER call this method without calling refresh() or getPOIS()!
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
  * @return {string} EuropaPark JWT Token
  */
  async refreshEP() {
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
  };

  /**
  * Get All POIS of EuropaPark
  * This data contains all the POIS in EuropaPark
  */
  async getPOIS() {
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
          const poi = {};
          const singleRider = 'false'; // EP doesn't send these values
          let fastPass = 'false'; // Set fastpass to false as default
          let isVirtQueue = 'false'; // Default poi isn't a virtqueue
          rideData.pois.forEach((ride) => { // Data includes Rulantica, however, they're listed as slides, so not defining anything special here.
            if (ride.type === 'attraction' && ride.code !== null) { // Return rides and pois which haven't null
              if (ride.name.indexOf('Queue - ') === 0) return; // Ignore the Queue Pointers
              if (ride.name.indexOf('VirtualLine: ') === 0) { // So EP reports virtlane as seperate map pointer, they send it as a stand-alone POI, assign the VirtQueue tag here.
                fastPass = 'true';
                isVirtQueue = 'true';
              } else { // Yay, it's not a Virtline entry!
                fastPass = 'false';
                isVirtQueue = 'false';
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

              // Build the ride object
              poi[ride.code] = {
                name: ride.name,
                id: 'Europapark_' + ride.code,
                waitTime: null,
                state: null,
                active: null,
                location: {
                  latitude: ride.latitude,
                  longitude: ride.longitude,
                },
                meta: {
                  area: area,
                  single_rider: singleRider,
                  fastPass: fastPass,
                  type: ride.type,
                  single_rider: 'false',
                  isVirtQueue: isVirtQueue,
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
                    minHeightCompanion: minHeightAdult,
                    maxHeight: maxHeight,
                    minAge: minAge,
                    minAgeCompagnion: minAgeAdult,
                  },
                },
              };
            };
          });
          return Promise.resolve(poi);
        });
  };

  /**
  * Get All Queues of EuropaPark
  * This data contains all the Queues in EuropaPark, attached with pois above.
  */
  async getQueue() {
    const token = await this.refreshEP();
    const rideData = await this.getPOIS();

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

            if (ridetime.time > 0 && ridetime.time < 91) {
              waitTime = ridetime.time;
              state = 'Operating';
              active = 'true';
            } else if (ridetime.time === 91) {
              waitTime = 91;
              state = 'Operating';
              active = 'true';
            } else if (ridetime.time === 333 || ridetime.time === 666 || ridetime.time === 777) {
              waitTime = 0;
              state = 'Closed';
              active = 'false';
            } else if (ridetime.status === 444 || ridetime.time === 555 || ridetime.time === 999) {
              waitTime = 0;
              state = 'Down';
              active = 'false';
            } else if (ridetime.time === 222) {
              waitTime = 0;
              state = 'Refurbishment';
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
                  latitude: rideData[ridetime.code].location.latitude,
                  longitude: rideData[ridetime.code].location.longitude,
                },
                meta: {
                  type: rideData[ridetime.code].meta.type,
                  area: rideData[ridetime.code].meta.area,
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
  * Get All Operating Hours of EuropaPark
  * This data contains all the Operating Hours in EuropaPark, fetched with currentyear.
  */
  async getOpHours() {
    const token = await this.refreshEP();

    return fetch(
        this.config.apiBase +
          `europapark/opentime/`,
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
          const Calendar = [];
          // Execute Calendar stuff here
          return Promise.resolve(Calendar);
        });
  }
}

export default EuropaPark;
