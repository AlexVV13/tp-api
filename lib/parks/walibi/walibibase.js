import moment from 'moment-timezone';
import fetch from 'node-fetch';
import {Park} from '../park.js';
import {entityType, queueType, scheduleType} from '../types.js';
import {entityCategory, entityTags} from '../tags.js';

import dotenv from 'dotenv';
dotenv.config();

/**
* Walibi Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* Most park specific parameters are set already
* @class
*/
export class WalibiBase extends Park {
  /**
  * Create a new Walibi Park object
  * @param {object} options
  */
  constructor(options = {}) {
    // Language settings
    options.languages = options.languages || process.env.LANGUAGES;

    options.langoptions = options.langoptions || `{'en', 'de', 'nl'}`;

    super(options);

    // Check for existance
    if (!this.config.apiBase) throw new Error('Missing Walibi apiBase!');
    if (!this.config.languages) {
      this.config.languages = 'en';
    };
  }

  /**
  * Get All POIS of Walibi
  * This data contains all the POIS in Walibi
  * @return {string} All Walibi POIS
  */
  async getPOIS() {
    return fetch(this.config.apiBase +
      '/entertainments',
    {
      method: 'GET',
    },
    )
        .then((res) => res.json())
        .then((rideData) => {
          return Promise.resolve(rideData);
        });
  }

  /**
  * Get All wc of Walibi
  * This data contains all the wc POIS in Walibi park
  * @return {string} All Walibi wc POIS
  */
  async buildWCPOI() {
    return await this.getPOIS().then((rideData) => {
      const poi = [];
      rideData.wc.forEach((ride) => {
        let description = undefined;
        let shortdescription = undefined;
        ride.additionalContent.forEach((desc) => {
          description = desc.text;
          shortdescription = desc.title;
        });

        const poiData = {
          name: ride.title,
          id: `${this.config.name}_` + ride.uuid,
          location: {
            latitude: ride.location.lat,
            longitude: ride.location.lon,
          },
          meta: {
            description: description,
            short_description: shortdescription,
            category: ride.category.name,
            type: entityType.service,
          },
        };
        poi.push(poiData);
      });
      return Promise.resolve(poi);
    });
  }

  /**
  * Get All Service of Walibi
  * This data contains all the SERVICE POIS in Walibi park
  * @return {string} All Walibi POIS
  */
  async buildServicePOI() {
    return await this.getPOIS().then((rideData) => {
      const poi = [];
      rideData.service.forEach((ride) => {
        let description = undefined;
        let shortdescription = undefined;
        ride.additionalContent.forEach((desc) => {
          description = desc.text;
          shortdescription = desc.title;
        });

        const poiData = {
          name: ride.title,
          id: `${this.config.name}_` + ride.uuid,
          location: {
            latitude: ride.location.lat,
            longitude: ride.location.lon,
          },
          meta: {
            description: description,
            short_description: shortdescription,
            category: ride.category.name,
            type: entityType.service,
          },
        };
        poi.push(poiData);
      });
      return Promise.resolve(poi);
    });
  }

  /**
  * Get All restaurant of Walibi
  * This data contains all the restaurant POIS in Walibi park
  * @return {string} All Walibi restaurant POIS
  */
  async buildRestaurantPOI() {
    return await this.getPOIS().then((rideData) => {
      const poi = [];
      rideData.restaurant.forEach((ride) => {
        let description = undefined;
        let shortdescription = undefined;
        ride.additionalContent.forEach((desc) => {
          description = desc.text;
          shortdescription = desc.title;
        });

        const poiData = {
          name: ride.title,
          id: `${this.config.name}_` + ride.uuid,
          location: {
            latitude: ride.location.lat,
            longitude: ride.location.lon,
          },
          meta: {
            description: description,
            short_description: shortdescription,
            category: ride.category.name,
            type: entityType.restaurant,
          },
        };
        poi.push(poiData);
      });
      return Promise.resolve(poi);
    });
  }

  /**
  * Get All shops of Walibi
  * This data contains all the shop POIS in Walibi park
  * @return {string} All Walibi shop POIS
  */
  async buildMerchandisePOI() {
    return await this.getPOIS().then((rideData) => {
      const poi = [];
      rideData.shop.forEach((ride) => {
        let description = undefined;
        let shortdescription = undefined;
        ride.additionalContent.forEach((desc) => {
          description = desc.text;
          shortdescription = desc.title;
        });

        const poiData = {
          name: ride.title,
          id: `${this.config.name}_` + ride.uuid,
          location: {
            latitude: ride.location.lat,
            longitude: ride.location.lon,
          },
          meta: {
            description: description,
            short_description: shortdescription,
            category: ride.category.name,
            type: entityType.merchandise,
          },
        };
        poi.push(poiData);
      });
      return Promise.resolve(poi);
    });
  }

  /**
  * Get All Show of Walibi
  * This data contains all the Show POIS in Walibi park
  * @return {string} All Walibi show POIS
  */
  async buildShowPOI() {
    return await this.getPOIS().then((rideData) => {
      const poi = [];
      rideData.show.forEach((ride) => {
        let description = undefined;
        let shortdescription = undefined;
        ride.additionalContent.forEach((desc) => {
          description = desc.text;
          shortdescription = desc.title;
        });

        const poiData = {
          name: ride.title,
          id: `${this.config.name}_` + ride.uuid,
          location: {
            latitude: ride.location.lat,
            longitude: ride.location.lon,
          },
          meta: {
            description: description,
            short_description: shortdescription,
            category: ride.category.name,
            type: entityType.show,
          },
        };
        poi.push(poiData);
      });
      return Promise.resolve(poi);
    });
  }

  /**
  * Get All Rides of Walibi
  * This data contains all the Ride POIS in Walibi park
  * @return {string} All Walibi ride POIS
  */
  async buildRidePOI() {
    return await this.getPOIS().then((rideData) => {
      const poi = [];
      let minHeightAccompanied = undefined;
      let minHeight = undefined;
      rideData.entertainment.forEach((ride) => {
        const category = [];
        const tags = [];
        if (ride.babyswitch === true) {
          tags.push(entityTags.childSwap);
        }
        if (ride.category.name === 'Family') {
          category.push(entityCategory.family);
        }
        if (ride.category.name === 'Kids') {
          category.push(entityCategory.youngest);
        }
        if (ride.category.name === 'Thrills') {
          category.push(entityCategory.thrill);
        }

        ride.parameters.forEach((param) => {
          if (param.title === 'taille min accompagné' || param.title === 'min accompanied heigh') {
            minHeightAccompanied = param.value;
          }
          if (param.title === 'taille min non accompagné' || param.title === 'min unaccompanied heigh') {
            minHeight = param.value;
          }
        });

        const restrictions = {
          minHeightAccompanied,
          minHeight,
        };

        let description = undefined;
        let shortdescription = undefined;
        ride.additionalContent.forEach((desc) => {
          description = desc.text;
          shortdescription = desc.title;
        });

        const poiData = {
          name: ride.title,
          id: `${this.config.name}_` + ride.uuid,
          location: {
            latitude: ride.location.lat,
            longitude: ride.location.lon,
          },
          meta: {
            description: description,
            short_description: shortdescription,
            category,
            type: entityType.ride,
            restrictions,
          },
        };
        poi.push(poiData);
      });
      return Promise.resolve(poi);
    });
  }

  /**
  * Get All Queues of Walibi
  * This data contains all the POIS in Walibi park
  * @return {string} All Walibi POIS with queuetimes
  */
  async getQueue() {
    return await this.getPOIS().then((rideData) => {
      const poi = [];
      rideData.entertainment.forEach((ride) => {
        let waitTime = null;
        let active = null;
        let state = null;

        if (ride.waitingTime == -10) {
          waitTime = '0';
          state = queueType.closed;
          active = 'false';
        } else {
          waitTime = ride.waitingTime;
          state = queueType.operating;
          active = 'true';
        }

        let minHeight = null;
        let minHeightCompanion = null;

        ride.parameters.forEach((param) => {
          if (param.title === 'taille min accompagné') {
            minHeightCompanion = param.value;
          } else if (param.title === 'taille min non accompagné') {
            minHeight = param.value;
          }
        });

        const poiData = {
          name: ride.title,
          id: `${this.config.name}_` + ride.uuid,
          state: state,
          active: active,
          waitTime: waitTime,
          location: {
            latitude: ride.location.lat,
            longitude: ride.location.lon,
          },
          meta: {
            category: ride.category.name,
            type: entityType.ride,
            restrictions: {
              minHeight: minHeight,
              minHeightAccompanies: minHeightCompanion,
            },
          },
        };
        poi.push(poiData);
      });
      return Promise.resolve(poi);
    });
  }

  /**
  * Get All Operating Hours of Walibi
  * This data contains all the Operating Hours in Walibi, fetched with currentyear.
  * @return {string} All Walibi calendar data
  */
  async getOpHours() {
    const currentYear = moment().format('YYYY');
    return fetch(
        this.config.apiBase +
          `/calendar/${currentYear}?_format=json`,
        {
          method: 'GET',
        },
    )
        .then((res) => res.json())
        .then((json) => {
          const Calendar = [];
          // Execute Calendar stuff here
          // The calendar provides data for the whole year, however, we don't want past data.
          Object.keys(json.opening_hours).forEach((key) => {
            const now = moment().format('MM') + '\/' + moment().format('DD');

            // Only continue if our hit is AFTER yesterday
            if (moment(key).isSameOrAfter(moment(now))) {
              let state = json.opening_hours[key].status;
              let open = undefined;
              let close = undefined;
              const datesplit = key.split('/');
              const date = currentYear + '-' + datesplit[0] + '-' + datesplit[1];
              // Park is closed, nothing returned
              if (state === 'closed') {
                state = scheduleType.closed;
                open = moment(`${date} 23:59`, 'YYYY-MM-DD HH:mm a', `${this.config.Timezone}`).format();
                close = moment(`${date} 23:59`, 'YYYY-MM-DD HH:mm a', `${this.config.Timezone}`).format();
                // Park is open, but sold out, strangely enough operating hours are removed as well
              } else if (state === 'soldout') {
                open = moment(`${date} 10:00`, 'YYYY-MM-DD HH:mm a', `${this.config.Timezone}`).format();
                close = moment(`${date} 23:00`, 'YYYY-MM-DD HH:mm a', `${this.config.Timezone}`).format();
                state = scheduleType.operating;
                // Park is operating as normal
              } else {
                state = scheduleType.operating;
                open = moment(`${date} ${json.opening_hours[key].mo_time}`, 'YYYY-MM-DD HH:mm a', `${this.config.Timezone}`).format();
                close = moment(`${date} ${json.opening_hours[key].mc_time}`, 'YYYY-MM-DD HH:mm a', `${this.config.Timezone}`).format();
              }

              // Set the hours object
              const hourobj = {
                openingTime: open,
                closingTime: close,
                date: date,
                type: state,
              };
              Calendar.push(hourobj);
            }
          });
          return Promise.resolve(Calendar);
        });
  }
}

export default WalibiBase;
