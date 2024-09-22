import fetch from 'node-fetch';
import {Park} from '../park.js';
import {entityType, queueType} from '../types.js';
import {entityTags} from '../tags.js';

import dotenv from 'dotenv';
dotenv.config();

/**
* CDA Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* Most park specific parameters are set already
* @class
*/
export class CDABase extends Park {
  /**
  * Create a new Compagnie des Alpes Park object
  * @param {object} options
  */
  constructor(options = {}) {
    // Language settings
    options.cachepoistime = process.env.CACHE_DURATION_POIS;
    options.languages = process.env.LANGUAGES;

    options.langoptions = `{'en', 'de', 'nl'}`;

    super(options);

    // Check for existance
    if (!this.config.apiBase) throw new Error('Missing Compagnie des Alpes apiBase!');
    if (!this.config.languages) {
      this.config.languages = 'en';
    };
    if (!this.config.cachepoistime) {
      this.config.cachepoistime = '12';
    };
  }

  /**
  * Get All POIS of Compagnie des Alpes
  * This data contains all the POIS in Compagnie des Alpes
  * @return {string} All Compagnie des Alpes POIS
  */
  async getPOIS() {
    return fetch(this.config.apiBase +
      `${this.config.languages}/attractions.v1.json`,
    {
      method: 'GET',
      headers: {
        'x-api-key': this.config.apiKey,
      },
    },
    )
        .then((res) => res.json())
        .then((rideData) => {
          return Promise.resolve(rideData);
        });
  }

  /**
  * Get All wc of Compagnie des Alpes
  * This data contains all the wc POIS in Compagnie des Alpes park
  * @return {string} All Compagnie des Alpes wc POIS
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
          id: ride.uuid,
          location: {
            latitude: JSON.parse(ride.location.lat),
            longitude: JSON.parse(ride.location.lon),
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
  * Get All Service of Compagnie des Alpes
  * This data contains all the SERVICE POIS in Compagnie des Alpes park
  * @return {string} All Compagnie des Alpes POIS
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
          id: ride.uuid,
          location: {
            latitude: JSON.parse(ride.location.lat),
            longitude: JSON.parse(ride.location.lon),
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
  * Get All restaurant of Compagnie des Alpes
  * This data contains all the restaurant POIS in Compagnie des Alpes park
  * @return {string} All Compagnie des Alpes restaurant POIS
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
          id: ride.uuid,
          location: {
            latitude: JSON.parse(ride.location.lat),
            longitude: JSON.parse(ride.location.lon),
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
  * Get All shops of Compagnie des Alpes
  * This data contains all the shop POIS in Compagnie des Alpes park
  * @return {string} All Compagnie des Alpes shop POIS
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
          id: ride.uuid,
          location: {
            latitude: JSON.parse(ride.location.lat),
            longitude: JSON.parse(ride.location.lon),
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
  * Get All Show of Compagnie des Alpes
  * This data contains all the Show POIS in Compagnie des Alpes park
  * @return {string} All Compagnie des Alpes show POIS
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
          id: ride.uuid,
          location: {
            latitude: JSON.parse(ride.location.lat),
            longitude: JSON.parse(ride.location.lon),
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
  * Get All Rides of Compagnie des Alpes
  * This data contains all the Ride POIS in Compagnie des Alpes park
  * @return {string} All Compagnie des Alpes ride POIS
  */
  async buildRidePOI() {
    return await this.getPOIS().then((rideData) => {
      const poi = [];

      rideData.forEach((ride) => {
        const category = [];
        const tags = [];
        if (ride.babyswitch === true) {
          tags.push(entityTags.childSwap);
        }
        const lat = JSON.parse(ride.latitude);
        const lon = JSON.parse(ride.longitude);

        poi[ride.waitingTimeName] = {
          name: ride.title,
          id: ride.waitingTimeName,
          location: {
            latitude: lat,
            longitude: lon,
          },
          meta: {
            category,
            type: entityType.ride,
            descriptions: {
              description: 'Test',
              short_description: 'Test',
            },
          },
        };
      });
      return Promise.resolve(poi);
    });
  }

  /**
  * Get All Queues of Compagnie des Alpes
  * This data contains all the POIS in Compagnie des Alpes park
  * @return {string} All Compagnie des Alpes POIS with queuetimes
  */
  async getQueue() {
    const rideData = await this.buildRidePOI();
    return fetch(this.config.apiBase +
      `/waitingtimes.v1.json`,
    {
      method: 'GET',
      headers: {
        'x-api-key': this.config.apiKey,
      },
    },
    )
        .then((res) => res.json())
        .then((waitData) => {
          const rides = [];
          waitData.forEach((ride) => {
            let wait = null;
            let state = null;
            let active = null;

            if (ride.status === 'closed') {
              wait = 0;
              state = queueType.closed;
              active = false;
            } else if (ride.status === 'outoforder') {
              wait = 0;
              state = queueType.refurbishment;
              active = false;
            } else {
              wait = ride.time / 60;
              state = queueType.operating;
              active = true;
            }

            if (rideData[ride.id]) {
              rides.push({
                name: rideData[ride.id].name,
                id: rideData[ride.id].id,
                waitTime: wait,
                status: state,
                active: active,
                location: {
                  latitude: rideData[ride.id].location.latitude,
                  longitude: rideData[ride.id].location.longitude,
                },
                meta: {
                  category: rideData[ride.id].meta.category,
                  type: entityType.ride,
                  descriptions: rideData[ride.id].meta.descriptions,
                },
              });
            }
          });
          return rides;
        });
  }
}

export default CDABase;
