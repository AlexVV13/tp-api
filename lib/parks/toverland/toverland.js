import fetch from 'node-fetch';
import moment from 'moment-timezone';
import {Park} from '../park.js';

import dotenv from 'dotenv';
import {entityType, queueType, scheduleType} from '../types.js';
dotenv.config();

/**
* Toverland Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* Most park specific parameters are set already
* @class
*/
export class Toverland extends Park {
  /**
  * Create a new Toverland Park object
  * @param {object} options
  */
  constructor(options = {}) {
    options.name ='Toverland';
    options.timezone = 'Europe/Amsterdam';

    // Setting the parks entrance as latlon
    options.latitude = 51.397673285726114;
    options.longitude = 5.981651557822892;

    // Options for our park Object
    options.supportswaittimes = true;
    options.supportsschedule = true;
    options.supportsrideschedules = true;
    options.fastPass = false;
    options.FastPassReturnTimes = false;

    // API options
    options.apiBase = process.env.TOVERLAND_APIBASE;
    options.apiKey = process.env.TOVERLAND_TOKEN;
    options.hoursUrl = process.env.TOVERLAND_HOURS;

    // Language settings
    options.languages = process.env.LANGUAGES;

    options.langoptions = `{'en', 'de', 'nl'}`;

    super(options);

    // Check for existance
    if (!this.config.apiBase) throw new Error('Missing Toverland apiBase!');
    if (!this.config.apiKey) throw new Error('Missing Toverland apiKey!');
    if (!this.config.hoursUrl) throw new Error('Missing Toverland Hours URL!');
    if (!this.config.languages) {
      this.config.languages = 'en';
    };
  }

  /**
  * Get All Ride POIS of Toverland
  * This data contains all the ride POIS in Toverland.
  * @return {string} All Toverland ride POI data
  */
  async buildRidePOI() {
    return await this.cache.wrap('rides', async () => {
      return fetch(`${this.config.apiBase}/park/ride/list`,
          {
            method: 'GET',
            headers: {
              'Authorization': this.config.apiKey,
            },
          },
      ).then((res) => res.json())
          .then((ride) => {
            const poi = {};
            const lang = this.config.languages;
            ride.forEach((pois) => {
              // What a stupid area definition.
              let area = undefined;
              if (pois.area_id === '1') {
                area = 'Land van Toos';
              } else if (pois.area_id === '2') {
                area = 'Wunderwald';
              } else if (pois.area_id === '3') {
                area = 'Ithaka';
              } else if (pois.area_id === '4') {
                area = 'De Magische Vallei';
              } else if (pois.area_id === '5') {
                area = 'Port Laguna';
              } else if (pois.area_id === '6') {
                area = 'Avalon';
              }

              const descr = pois.description[lang];
              const shortdesc = pois.short_description[lang];

              let minHeightCM = undefined;
              let minHeightComp = undefined;
              if (pois.minLength !== null) {
                minHeightCM = pois.minLength + '0 cm';
              }
              if (pois.supervision !== null) {
                minHeightComp= pois.supervision + '0 cm';
              }
              const restrictions = {
                minHeight: minHeightCM,
                minHeightAccompanied: minHeightComp,
              };
              poi[pois.id] = {
                id: `Toverland_${pois.id}`,
                name: pois.name,
                location: {
                  latitude: JSON.parse(pois.latitude),
                  longitude: JSON.parse(pois.longitude),
                  area: area,
                },
                meta: {
                  description: descr,
                  short_description: shortdesc,
                  type: entityType.ride,
                  restrictions,
                },
              };
            });
            return Promise.resolve(poi);
          });
    }, 1000 * 60 * 60 * 12); // 12 hours
  };

  /**
  * Get All Restaurant POIS of Toverland
  * This data contains all the Restaurant POIS in Toverland.
  * @return {string} All Toverland Restaurant POI data
  */
  async buildRestaurantPOI() {
    return await this.cache.wrap('restaurant', async () => {
      return fetch(`${this.config.apiBase}/park/foodAndDrinks/list`,
          {
            method: 'GET',
            headers: {
              'Authorization': this.config.apiKey,
            },
          },
      ).then((res) => res.json())
          .then((ride) => {
            const poi = {};
            const lang = this.config.languages;
            ride.forEach((pois) => {
              // What a stupid area definition.
              let area = undefined;
              if (pois.area_id === '1') {
                area = 'Land van Toos';
              } else if (pois.area_id === '2') {
                area = 'Wunderwald';
              } else if (pois.area_id === '3') {
                area = 'Ithaka';
              } else if (pois.area_id === '4') {
                area = 'De Magische Vallei';
              } else if (pois.area_id === '5') {
                area = 'Port Laguna';
              } else if (pois.area_id === '6') {
                area = 'Avalon';
              }

              const descr = pois.description[lang];
              const shortdesc = pois.short_description[lang];

              poi[pois.id] = {
                id: `Toverland_${pois.id}`,
                name: pois.name,
                location: {
                  latitude: JSON.parse(pois.latitude),
                  longitude: JSON.parse(pois.longitude),
                  area: area,
                },
                meta: {
                  description: descr,
                  short_description: shortdesc,
                  type: entityType.restaurant,
                },
              };
            });
            return Promise.resolve(poi);
          });
    }, 1000 * 60 * 60 * 12); // 12 hours
  };

  /**
  * Get All POIS of Toverland
  * This data contains all the POIS in Toverland.
  * @return {string} All Toverland POI data
  */
  async buildMerchandisePOI() {
    return await this.cache.wrap('merchandise', async () => {
      return fetch(`${this.config.apiBase}/park/shop/list`,
          {
            method: 'GET',
            headers: {
              'Authorization': this.config.apiKey,
            },
          },
      ).then((res) => res.json())
          .then((ride) => {
            const poi = {};
            const lang = this.config.languages;
            ride.forEach((pois) => {
              // What a stupid area definition.
              let area = undefined;
              if (pois.area_id === '1') {
                area = 'Land van Toos';
              } else if (pois.area_id === '2') {
                area = 'Wunderwald';
              } else if (pois.area_id === '3') {
                area = 'Ithaka';
              } else if (pois.area_id === '4') {
                area = 'De Magische Vallei';
              } else if (pois.area_id === '5') {
                area = 'Port Laguna';
              } else if (pois.area_id === '6') {
                area = 'Avalon';
              }

              const descr = pois.description[lang];
              const shortdesc = pois.short_description[lang];

              poi[pois.id] = {
                id: `Toverland_${pois.id}`,
                name: pois.name,
                location: {
                  latitude: JSON.parse(pois.latitude),
                  longitude: JSON.parse(pois.longitude),
                  area: area,
                },
                meta: {
                  description: descr,
                  short_description: shortdesc,
                  type: entityType.merchandise,
                },
              };
            });
            return Promise.resolve(poi);
          });
    }, 1000 * 60 * 60 * 12); // 12 hours
  };

  /**
  * Get All POIS of Toverland
  * This data contains all the POIS in Toverland.
  * @return {string} All Toverland POI data
  */
  async buildShowPOI() {
    return await this.cache.wrap('show', async () => {
      return fetch(`${this.config.apiBase}/park/show/list`,
          {
            headers: {
              'Authorization': this.config.apiKey,
            },
          },
      ).then((res) => res.json())
          .then((ride) => {
            const poi = {};
            const lang = this.config.languages;
            ride.forEach((pois) => {
              // What a stupid area definition.
              let area = undefined;
              if (pois.area_id === '1') {
                area = 'Land van Toos';
              } else if (pois.area_id === '2') {
                area = 'Wunderwald';
              } else if (pois.area_id === '3') {
                area = 'Ithaka';
              } else if (pois.area_id === '4') {
                area = 'De Magische Vallei';
              } else if (pois.area_id === '5') {
                area = 'Port Laguna';
              } else if (pois.area_id === '6') {
                area = 'Avalon';
              }

              const descr = pois.description[lang];
              const shortdesc = pois.short_description[lang];

              poi[pois.id] = {
                id: `Toverland_${pois.id}`,
                name: pois.name,
                location: {
                  latitude: JSON.parse(pois.latitude),
                  longitude: JSON.parse(pois.longitude),
                  area: area,
                },
                meta: {
                  description: descr,
                  short_description: shortdesc,
                  type: entityType.shop,
                },
              };
            });
            return Promise.resolve(poi);
          });
    }, 1000 * 60 * 60 * 12); // 12 hours
  };

  /**
  * Get All Halloween POIS of Toverland
  * This data contains all the Halloween POIS in Toverland.
  * @return {string} All Toverland Halloween POI data
  */
  async buildHalloweenPOI() {
    return await this.cache.wrap('halloween', async () => {
      return fetch(`${this.config.apiBase}/park/halloween/list`,
          {
            method: 'GET',
            headers: {
              'Authorization': this.config.apiKey,
            },
          },
      ).then((res) => res.json())
          .then((ride) => {
            const poi = {};
            const lang = this.config.languages;
            ride.forEach((pois) => {
              // What a stupid area definition.
              let area = undefined;
              if (pois.area_id === '1') {
                area = 'Land van Toos';
              } else if (pois.area_id === '2') {
                area = 'Wunderwald';
              } else if (pois.area_id === '3') {
                area = 'Ithaka';
              } else if (pois.area_id === '4') {
                area = 'De Magische Vallei';
              } else if (pois.area_id === '5') {
                area = 'Port Laguna';
              } else if (pois.area_id === '6') {
                area = 'Avalon';
              }

              const descr = pois.description[lang];
              const shortdesc = pois.short_description[lang];

              poi[pois.id] = {
                id: `Toverland_${pois.id}`,
                name: pois.name,
                location: {
                  latitude: JSON.parse(pois.latitude),
                  longitude: JSON.parse(pois.longitude),
                  area: area,
                },
                meta: {
                  description: descr,
                  short_description: shortdesc,
                  type: entityType.halloween,
                },
              };
            });
            return Promise.resolve(poi);
          });
    }, 1000 * 60 * 60 * 12); // 12 hours
  };

  /**
  * Get All Halloween POIS of Toverland
  * This data contains all the Halloween POIS in Toverland.
  * @return {string} All Toverland Halloween POI data
  */
  async buildServicePOI() {
    return await this.cache.wrap('service', async () => {
      return fetch(`${this.config.apiBase}/park/services/list`,
          {
            method: 'GET',
            headers: {
              'Authorization': this.config.apiKey,
            },
          },
      ).then((res) => res.json())
          .then((ride) => {
            const poi = {};
            const lang = this.config.languages;
            ride.forEach((pois) => {
              // What a stupid area definition.
              let area = undefined;
              if (pois.area_id === '1') {
                area = 'Land van Toos';
              } else if (pois.area_id === '2') {
                area = 'Wunderwald';
              } else if (pois.area_id === '3') {
                area = 'Ithaka';
              } else if (pois.area_id === '4') {
                area = 'De Magische Vallei';
              } else if (pois.area_id === '5') {
                area = 'Port Laguna';
              } else if (pois.area_id === '6') {
                area = 'Avalon';
              }

              let descr = undefined;
              let shortdesc = undefined;
              if (pois.description !== null) {
                descr = pois.description[lang];
                shortdesc = pois.short_description[lang];
              } else {
                descr = undefined;
                shortdesc = undefined;
              }

              poi[pois.id] = {
                id: `Toverland_${pois.id}`,
                name: pois.name,
                location: {
                  latitude: JSON.parse(pois.latitude),
                  longitude: JSON.parse(pois.longitude),
                  area: area,
                },
                meta: {
                  description: descr,
                  short_description: shortdesc,
                  type: entityType.service,
                },
              };
            });
            return Promise.resolve(poi);
          });
    }, 1000 * 60 * 60 * 12); // 12 hours
  };

  /**
  * Build the Queue object here, cause thats cool
  * @return {string} All Ride pois with queues attached
  */
  async getQueue() {
    const rideData = await this.buildRidePOI();
    // FYI, this link actually provides the buildRidePOI data, however, I prefer doing it this way since I don't like caching queues
    return fetch(`${this.config.apiBase}/park/ride/operationInfo/list`,
        {
          method: 'GET',
          headers: {
            'Authorization': this.config.apiKey,
          },
        },
    ).then((res) => res.json())
        .then((ride) => {
          const rides = [];
          ride.forEach((poi) => {
            let state = poi.last_status.status.name.en;
            let waitTime = null;
            let active = null;
            // Ride is closed
            if (state === 'Closed') {
              waitTime = '0';
              active = false;
              state = queueType.closed;
            // Ride is open, no queue known
            } else if (state === 'Open without waiting time') {
              waitTime = '0';
              active = true;
              state = queueType.operating;
            // Ride is open at some strange unknown times, depends on where the operator is
            } else if (state === 'Variable schedule') {
              waitTime = '0';
              active = true;
              state = queueType.operating;
            // Open, but somehow the last_waiting_time disappeared. Too bad...
            } else if (state === 'Open' && !ride.last_waiting_time) {
              waitTime = '0';
              active = true;
              state = queueType.operating;
            // Finally! It is normally open!
            } else if (state === 'Open') {
              waitTime = ride.last_waiting_time.waiting_time;
              active = true;
              state = queueType.operating;
            // We'll assume ride is closed?
            } else {
              waitTime = '0';
              active = false;
              state = queueType.down;
            }

            let openTime = undefined;
            let closingTime = undefined;
            let type = undefined;
            if (Object.keys(poi.opening_times).length < 1) {
              openTime = moment('23:59', 'HH:mm').format();
              closingTime = moment('23:59', 'HH:mm').format();
              type = scheduleType.closed;
            } else {
              openTime = moment(poi.opening_times.start, 'YYYY-MM-DD HH:mm:ss').format();
              closingTime = moment(poi.opening_times.end, 'YYYY-MM-DD HH:mm:ss').format();
              type = scheduleType.operating;
            }

            if (rideData[poi.id]) {
              const rideobj = {
                id: rideData[poi.id].id,
                name: rideData[poi.id].name,
                waitTime: waitTime,
                active: active,
                state: state,
                location: rideData[poi.id].location,
                meta: rideData[poi.id].meta,
                schedule: {
                  openTime: openTime,
                  closingTime: closingTime,
                  type: type,
                },
              };
              rides.push(rideobj);
            }
          });
          return Promise.resolve(rides);
        });
  }

  /**
   * Get operating hours Toverland
   * @return {string} Operating Hours for 1 week
   */
  async getOpHours() {
    const weekday = moment().format('YYYY-MM-DD');
    return fetch(`${this.config.hoursUrl}${weekday}&L=3`,
        {
          method: 'GET',
        },
    ).then((res) => res.json())
        .then((hours) => {
          const Calendar = [];
          Object.keys(hours.week).forEach((times) => {
            const date = hours.week[times].date.full;
            let open = undefined;
            let close = undefined;
            let state = undefined;
            // Park is closed
            if (hours.week[times].time_open == '00:00') {
              open = moment(`${date} 23:59`).format();
              close = moment(`${date} 23:59`).format();
              state = scheduleType.closed;
            // Park is open
            } else {
              open = moment(`${date} ${hours.week[times].time_open}`).format();
              close = moment(`${date} ${hours.week[times].time_close}`).format();
              state = scheduleType.operating;
            };
            // Create the schedule object
            const hourobj = {
              openingTime: open,
              closingTime: close,
              date: date,
              type: state,
            };
            Calendar.push(hourobj);
          });
          return Promise.resolve(Calendar);
        });
  }
}

export default Toverland;
