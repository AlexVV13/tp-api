import fetch from 'node-fetch';
import {Park} from '../park.js';
import {entityType, queueType, scheduleType} from '../types.js';
import moment from 'moment-timezone';

import dotenv from 'dotenv';
dotenv.config();

/**
* Plopsa Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* Most park specific parameters are set already
* @class
*/
export class PlopsaBase extends Park {
  /**
  * Create a new Plopsa Park object
  * @param {object} options
  */
  constructor(options = {}) {
    // Language settings
    options.cachepoistime = process.env.CACHE_DURATION_POIS;
    options.languages = process.env.LANGUAGES;
    options.token = process.env.PLOPSA_TOKEN;

    options.langoptions = options.langoptions || `{'en', 'de', 'nl'}`;

    super(options);

    // Check for existance
    if (!this.config.apiBase) throw new Error('Missing Plopsa apiBase!');
    if (!this.config.apiId) throw new Error('Missing Plopsa apiId!');
    if (!this.config.token) throw new Error('Missing token!');
    if (!this.config.languages) {
      this.config.languages = 'en';
    };
    if (!this.config.cachepoistime) {
      this.config.cachepoistime = '12';
    };
  }

  /**
   * Login to the Plopsa API
   * @return {string} accesstoken
   */
  async loginAPI() {
    const bodydata = {
      'clientId': '7xfwRB8iK1tbf3cYiABI%%2Fw%%3D%%3D',
      'clientSecret': '6YqyzzOsaNkxDkHmwhgK%%2Fw%%3D%%3D',
    };
    return fetch(this.config.apiBase +
      `nl/api/v1.0/token/0001`,

    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodydata),
    },
    )
        .then((res) => res.json())
        .then((data) => {
          const token = data.accessToken;
          return token;
        });
  }

  /**
  * Get All POIS of Plopsa
  * This data contains all the POIS in Plopsa
  * @return {string} All Plopsa POIS
  */
  async getPOIS() {
    const token = this.config.token;
    return fetch(this.config.apiBase +
      `${this.config.languages}/api/v1.0/details/all/${this.config.apiId}/attraction?access_token=${token}`,
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
  * Get All Rides of Plopsa
  * This data contains all the Ride POIS in Plopsa park
  * @return {string} All Plopsa ride POIS
  */
  async buildRidePOI() {
    return await this.getPOIS().then((rideData) => {
      const poi = [];
      let minHeightAccompanied = undefined;
      let minHeight = undefined;
      let maxHeight = undefined;

      Object.keys(rideData.en.attraction).forEach((ride) => {
        const category = [];

        if (rideData.en.attraction[ride].minHeight) {
          minHeight = rideData.en.attraction[ride].minHeight;
        }
        if (rideData.en.attraction[ride].minHeightSupervised) {
          minHeightAccompanied = rideData.en.attraction[ride].minHeightSupervised;
        }
        if (rideData.en.attraction[ride].maxHeight) {
          maxHeight = rideData.en.attraction[ride].maxHeight;
        }

        const restrictions = {
          minHeightAccompanied,
          minHeight,
          maxHeight,
        };

        const description = rideData.en.attraction[ride].description;
        const shortdescription = undefined;

        const lat = undefined;
        const lon = undefined;

        let state = 'Down';

        if (rideData.en.attraction[ride].temporarily_closed === true ) {
          state = 'Closed';
        } else {
          state = 'Operating';
        }

        poi[rideData.en.attraction[ride].id] = {
          name: rideData.en.attraction[ride].name,
          id: rideData.en.attraction[ride].id,
          waitTime: rideData.en.attraction[ride].currentWaitingTime,
          status: state,
          location: {
            latitude: lat,
            longitude: lon,
          },
          meta: {
            description: description,
            shortdescription: shortdescription,
            category,
            type: entityType.ride,
            restrictions,
          },
        };
      });
      return Promise.resolve(poi);
    });
  }

  /**
  * Get All Queues of Plopsa
  * This data contains all the POIS in Plopsa park
  * @return {string} All Plopsa POIS with queuetimes
  */
  async getQueue() {
    const token = this.config.token;
    const rideData = await this.buildRidePOI();
    return fetch(this.config.apiBase +
      `en/api/v1.0/waitingTime/${this.config.apiId}/attraction?access_token=${token}`,
    {
      method: 'GET',
    },
    )
        .then((res) => res.json())
        .then((waitData) => {
          const rides = [];
          waitData.en.forEach((ride) => {
            let wait = Number(ride.currentWaitingTime);
            let state = rideData[ride.id].status;
            let active = true;

            if (wait === null || wait < 1) {
              wait = 0;
              state = queueType.closed;
              active = false;
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
                  description: rideData[ride.id].meta.description,
                  short_description: rideData[ride.id].meta.shortdescription,
                  category: rideData[ride.id].meta.category,
                  type: entityType.ride,
                  restrictions: rideData[ride.id].meta.restrictions,
                },
              });
            }
          });
          return rides;
        });
  }

  /**
  * Get All Operating Hours of Plopsa
  * This data contains all the Operating Hours in Plopsa, fetched with currentyear.
  * @return {string} All Plopsa calendar data
  */
  async getOpHours() {
    const token = this.config.token;
    return fetch(
        this.config.apiBase +
          `en/api/v1.0/calendar/${this.config.apiId}?access_token=${token}`,
        {
          method: 'GET',
        },
    )
        .then((res) => res.json())
        .then((json) => {
          const calendar = [];
          Object.keys(json.en.months).forEach((date) => {
            Object.keys(json.en.months[date].openOn).forEach((dates) => {
              const datename = moment(dates).format('YYYY-MM-DD');
              let openTime = undefined;
              let closeTime = undefined;
              let type = undefined;

              // Define the different opening types
              if (json.en.months[date].openOn[dates].label === '10.00 - 18.00') {
                openTime = moment(`${datename} 10:00`).format();
                closeTime = moment(`${datename} 18:00`).format();
                type = scheduleType.operating;
              } else if (json.en.months[date].openOn[dates].label === '10.00 - 17:30') {
                openTime = moment(`${datename} 10:00`).format();
                closeTime = moment(`${datename} 17:30`).format();
                type = scheduleType.operating;
              } else if (json.en.months[date].openOn[dates].label === 'Sold out') {
                openTime = moment(`${datename} 10:00`).format();
                closeTime = moment(`${datename} 22:30`).format();
                type = scheduleType.operating;
              } else if (json.en.months[date].openOn[dates].label === '10.00 - 19:00') {
                openTime = moment(`${datename} 10:00`).format();
                closeTime = moment(`${datename} 19:00`).format();
                type = scheduleType.operating;
              } else if (json.en.months[date].openOn[dates].label === '10.00 - 22:30') {
                openTime = moment(`${datename} 10:00`).format();
                closeTime = moment(`${datename} 22:30`).format();
                type = scheduleType.operating;
              } else if (json.en.months[date].openOn[dates].label === 'Only Mayaland Indoor: 10.30 - 16.30') {
                openTime = moment(`${datename} 10:30`).format();
                closeTime = moment(`${datename} 16:30`).format();
                type = scheduleType.operating;
              } else if (json.en.months[date].openOn[dates].label === 'Open') { // Wtf???
                openTime = moment(`${datename} 10:00`).format();
                closeTime = moment(`${datename} 19:00`).format();
                type = scheduleType.operating;
              } else {
                openTime = moment(`${datename} 23:59`).format();
                closeTime = moment(`${datename} 23:59`).format();
                type = scheduleType.closed;
              }

              // Create the schedule object
              const schedule = {
                openingTime: openTime,
                closingTime: closeTime,
                type: type,
                date: datename,
              };
              calendar.push(schedule);
            });
          });
          return Promise.resolve(calendar);
        });
  }
}

export default PlopsaBase;
