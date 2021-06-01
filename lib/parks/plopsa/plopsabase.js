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

    options.langoptions = options.langoptions;

    super(options);

    // Check for existance
    if (!this.config.apiBase) throw new Error('Missing Plopsa apiBase!');
    if (!this.config.apiId) throw new Error('Missing Plopsa apiId!');
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
    // In order to login we have to act like a mobile device
    const bodydata = {
      'clientId': '7xfwRB8iK1tbf3cYiABI%%2Fw%%3D%%3D',
      'clientSecret': '6YqyzzOsaNkxDkHmwhgK%%2Fw%%3D%%3D',
    };

    return fetch(this.config.apiBase +
      `${this.config.languages}/api/v1.0/token/0001`,
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
          return token; // Return the access token and don't save it since its expiration time is almost instant
        });
  }

  /**
  * Get All POIS of Plopsa
  * This data contains all the POIS in Plopsa
  * @return {string} All Plopsa POIS
  */
  async getPOIS() {
    // Obtain the access token
    const token = await this.loginAPI();

    return fetch(this.config.apiBase +
      `${this.config.languages}/api/v1.0/details/all/${this.config.apiId}/attraction?access_token=${token}`,
    {
      method: 'GET',
    },
    )
        .then((res) => res.json())
        .then((rideData) => {
          return Promise.resolve(rideData); // Return all the attraction data immediately
        });
  }

  /**
  * Get All Rides of Plopsa
  * This data contains all the Ride POIS in Plopsa park
  * @return {string} All Plopsa ride POIS
  */
  async buildRidePOI() {
    // First fetch the ride data
    return await this.getPOIS().then((rideData) => {
      const poi = [];

      // Declare default height values
      let minHeightAccompanied = undefined;
      let minHeight = undefined;
      let maxHeight = undefined;

      Object.keys(rideData.en.attraction).forEach((ride) => { // This only fetches English data
        // Categories, however Plopsa doesn't use them
        const category = [];

        // Add the values of the height restrictions
        if (rideData.en.attraction[ride].minHeight) {
          minHeight = rideData.en.attraction[ride].minHeight;
        }
        if (rideData.en.attraction[ride].minHeightSupervised) {
          minHeightAccompanied = rideData.en.attraction[ride].minHeightSupervised;
        }
        if (rideData.en.attraction[ride].maxHeight) {
          maxHeight = rideData.en.attraction[ride].maxHeight;
        }

        // Create the restrictions Object
        const restrictions = {
          minHeightAccompanied,
          minHeight,
          maxHeight,
        };

        // Description is served, short_desc isn't
        const description = rideData.en.attraction[ride].description;
        const shortdescription = undefined;

        // Plopsaland doesn't send latlon values
        const lat = undefined;
        const lon = undefined;

        // Create the ride object
        poi[rideData.en.attraction[ride].id] = {
          name: rideData.en.attraction[ride].name,
          id: rideData.en.attraction[ride].id,
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
      return Promise.resolve(poi); // Return all rides
    });
  }

  /**
  * Get All Queues of Plopsa
  * This data contains all the POIS in Plopsa park
  * @return {string} All Plopsa POIS with queuetimes
  */
  async getQueue() {
    // Obtain token and ridedata first
    const token = await this.loginAPI();
    const rideData = await this.buildRidePOI();

    return fetch(this.config.apiBase +
      `en/api/v1.0/waitingTime/${this.config.apiId}/attraction?access_token=${token}`,
    {
      method: 'GET',
    },
    )
        .then((res) => res.json())
        .then((waitData) => {
          // Create the ride array
          const rides = [];

          waitData.en.forEach((ride) => {
            // Declare default values (Plopsa doesn't send down or maintenance)
            let wait = ride.currentWaitingTime;
            let state = queueType.operating;
            let active = true;

            // Only includes dead and unfinished rides.
            if (wait === null) {
              wait = 0;
              state = queueType.closed;
              active = false;
            }

            // If the entity exists in the queue api and ride data, build the ride object with queues
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
    const token = await this.loginAPI();
    return fetch(
        this.config.apiBase +
          `en/api/v1.0/calendar/${this.config.apiId}?access_token=${token}`,
        {
          method: 'GET',
        },
    )
        .then((res) => res.json())
        .then((json) => {
          // Calendar array
          const calendar = [];

          if (!json.en) { // If the parks are closed nothing is returned at all so build an entity for today saying it's closed.
            const date = moment().format('YYYY-MM-DD');
            const time = moment('23:59', 'HH:mm a').format();
            const type = scheduleType.closed;
            const schedule = {
              name: 'Closed',
              openingTime: time,
              closingTime: time,
              type: type,
              date: date,
            };
            calendar.push(schedule);
            return calendar;
          } else {
            Object.keys(json.en.months).forEach((date) => {
              // The API only returns data if open, in seperate month objects.
              Object.keys(json.en.months[date].openOn).forEach((dates) => {
                // Create default values
                const datename = moment(dates).format('YYYY-MM-DD');
                let openTime = undefined;
                let closeTime = undefined;
                let type = undefined;
                let name = undefined;

                // Define the different opening types
                if (json.en.months[date].openOn[dates].label === '10.00 - 18.00') {
                  openTime = moment(`${datename} 10:00`).format();
                  closeTime = moment(`${datename} 18:00`).format();
                  type = scheduleType.operating;
                  name = 'Open from 10:00 - 18:00';
                } else if (json.en.months[date].openOn[dates].label === '10.00 - 17:30') {
                  openTime = moment(`${datename} 10:00`).format();
                  closeTime = moment(`${datename} 17:30`).format();
                  type = scheduleType.operating;
                  name = 'Open from 10:00 - 17:30';
                } else if (json.en.months[date].openOn[dates].label === 'Sold out') {
                  openTime = moment(`${datename} 10:00`).format();
                  closeTime = moment(`${datename} 23:00`).format(); // Longest possible closing time is 23:00+2:00
                  type = scheduleType.operating;
                  name = 'Park sold out, longest possible opening hours are in place';
                } else if (json.en.months[date].openOn[dates].label === '10.00 - 19:00') {
                  openTime = moment(`${datename} 10:00`).format();
                  closeTime = moment(`${datename} 19:00`).format();
                  type = scheduleType.operating;
                  name = 'Open from 10:00 - 19:00';
                } else if (json.en.months[date].openOn[dates].label === '10.00 - 22:30') {
                  openTime = moment(`${datename} 10:00`).format();
                  closeTime = moment(`${datename} 22:30`).format();
                  type = scheduleType.operating;
                  name = 'Open from 10:00 - 22:30';
                } else if (json.en.months[date].openOn[dates].label === 'Only Mayaland Indoor: 10.30 - 16.30') { // Only for De Panne
                  openTime = moment(`${datename} 10:30`).format();
                  closeTime = moment(`${datename} 16:30`).format();
                  type = scheduleType.operating;
                  name = 'Mayaland Indoor open from 10:30 - 16:30';
                } else if (json.en.months[date].openOn[dates].label === 'Open') { // Wtf??? Open withour hours, cool
                  openTime = moment(`${datename} 10:00`).format();
                  closeTime = moment(`${datename} 19:00`).format();
                  type = scheduleType.operating;
                  name = 'Open without hours, 10-19 hours are in place';
                } else {
                  openTime = moment(`${datename} 23:59`).format();
                  closeTime = moment(`${datename} 23:59`).format();
                  type = scheduleType.closed;
                  name = 'Closed';
                }

                // Create the schedule object
                const schedule = {
                  name: name,
                  openingTime: openTime,
                  closingTime: closeTime,
                  type: type,
                  date: datename,
                };
                calendar.push(schedule);
              });
            });
          }
          return Promise.resolve(calendar);
        });
  }
}

export default PlopsaBase;
