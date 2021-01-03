import moment from 'moment-timezone';
import fetch from 'node-fetch';
import {Park} from '../park.js';
import {entityType, queueType} from '../types.js';

import dotenv from 'dotenv';
dotenv.config();

/**
* Walibi Belgium Park Object
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
  * Create a new Walibi Belgium Park object
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
        const poiData = {
          name: ride.title,
          id: `${this.config.name}_` + ride.uuid,
          location: {
            latitude: ride.location.lat,
            longitude: ride.location.lon,
          },
          meta: {
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
        const poiData = {
          name: ride.title,
          id: `${this.config.name}_` + ride.uuid,
          location: {
            latitude: ride.location.lat,
            longitude: ride.location.lon,
          },
          meta: {
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
        const poiData = {
          name: ride.title,
          id: `${this.config.name}_` + ride.uuid,
          location: {
            latitude: ride.location.lat,
            longitude: ride.location.lon,
          },
          meta: {
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
        const poiData = {
          name: ride.title,
          id: `${this.config.name}_` + ride.uuid,
          location: {
            latitude: ride.location.lat,
            longitude: ride.location.lon,
          },
          meta: {
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
        const poiData = {
          name: ride.title,
          id: `${this.config.name}_` + ride.uuid,
          location: {
            latitude: ride.location.lat,
            longitude: ride.location.lon,
          },
          meta: {
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
      rideData.entertainment.forEach((ride) => {
        const poiData = {
          name: ride.title,
          id: `${this.config.name}_` + ride.uuid,
          location: {
            latitude: ride.location.lat,
            longitude: ride.location.lon,
          },
          meta: {
            category: ride.category.name,
            type: entityType.ride,
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
          return Promise.resolve(Calendar);
        });
  }
}

export default WalibiBase;
