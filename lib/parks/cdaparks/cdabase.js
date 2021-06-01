import moment from 'moment-timezone';
import fetch from 'node-fetch';
import {Park} from '../park.js';
import {entityType, queueType, scheduleType} from '../types.js';
import {entityCategory, entityTags} from '../tags.js';

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
      this.config.cachepoistime = '12'; // Default cache value is 12 hours
    };
  }

  /**
  * Get All POIS of Compagnie des Alpes
  * This data contains all the POIS in Compagnie des Alpes
  * @return {string} All Compagnie des Alpes POIS
  */
  async getPOIS() {
    return fetch(this.config.apiBase +
      `${this.config.languages}/api/entertainments`,
    {
      method: 'GET',
    },
    )
        .then((res) => res.json())
        .then((rideData) => {
          // Immediately return ridedata
          return Promise.resolve(rideData);
        });
  }

  /**
  * Get All Rides of Compagnie des Alpes
  * This data contains all the Ride POIS in Compagnie des Alpes park
  * @return {string} All Compagnie des Alpes ride POIS
  */
  async buildRidePOI() {
    // Obtain the POIS
    return await this.getPOIS().then((rideData) => {
      // POI array
      const poi = [];

      // Set initial height values
      let minHeightAccompanied = undefined;
      let minHeight = undefined;

      rideData.entertainment.forEach((ride) => {
        const category = [];
        const tags = [];

        // Add tags and categories
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

        // Min height values, sometimes in french, sometimes in english
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

        // Add descriptions
        ride.additionalContent.forEach((desc) => {
          description = desc.text;
          shortdescription = desc.title;
        });

        let lat = undefined;
        let lon = undefined;

        // Add location
        if (ride.location) {
          lat = JSON.parse(ride.location.lat);
          lon = JSON.parse(ride.location.lon);
        }

        // Build the POI object
        poi[ride.uuid] = {
          name: ride.title,
          id: ride.uuid,
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
  * Get All Queues of Compagnie des Alpes
  * This data contains all the POIS in Compagnie des Alpes park
  * @return {string} All Compagnie des Alpes POIS with queuetimes
  */
  async getQueue() {
    // Obtain ridedata first
    const rideData = await this.buildRidePOI();
    return fetch(this.config.apiBase +
      `${this.config.languages}/api/waiting_time`,
    {
      method: 'GET',
    },
    )
        .then((res) => res.json())
        .then((waitData) => {
          // Ride array
          const rides = [];

          waitData.forEach((ride) => {
            // Set default values
            let wait = null;
            let state = null;
            let active = null;

            // Add the queuetime and ride status
            if (ride.status === 'closed') {
              wait = 0;
              state = queueType.closed;
              active = false;
            } else if (ride.status === 'outoforder') { // Seems to be maintenance?
              wait = 0;
              state = queueType.refurbishment;
              active = false;
            } else {
              wait = ride.waitingTime;
              state = queueType.operating;
              active = true;
            }

            // Attach queue if the poi exists
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
  * Get All Operating Hours of Compagnie des Alpes
  * This data contains all the Operating Hours in Compagnie des Alpes, fetched with currentyear.
  * @return {string} All Compagnie des Alpes calendar data
  */
  async getOpHours() {
    // Declare the currentyear for the URL
    const currentYear = moment().format('YYYY');
    return fetch(
        this.config.apiBase +
          `${this.config.languages}/api/calendar/${currentYear}?_format=json`,
        {
          method: 'GET',
        },
    )
        .then((res) => res.json())
        .then((json) => {
          // Calendar object
          const Calendar = [];

          // The calendar provides data for the whole year, however, we don't want past data.
          Object.keys(json.opening_hours).forEach((key) => {
            const now = moment().format('MM') + '\/' + moment().format('DD');

            // Only continue if our hit is AFTER yesterday
            if (moment(key).isSameOrAfter(moment(now))) {
              // Declare default statusses
              let state = json.opening_hours[key].status;
              let open = undefined;
              let close = undefined;
              let name = undefined;

              // Split the date object
              const datesplit = key.split('/');
              const date = currentYear + '-' + datesplit[0] + '-' + datesplit[1];

              // Park is closed, nothing returned
              if (state === 'closed') {
                name = 'Closed';
                state = scheduleType.closed;
                open = moment(`${date} 23:59`, 'YYYY-MM-DD HH:mm a', `${this.config.Timezone}`).format();
                close = moment(`${date} 23:59`, 'YYYY-MM-DD HH:mm a', `${this.config.Timezone}`).format();
              // Park is open, but sold out, strangely enough operating hours are removed as well
              } else if (state === 'soldout') {
                name = 'Sold out, using longest possible hours';
                open = moment(`${date} 10:00`, 'YYYY-MM-DD HH:mm a', `${this.config.Timezone}`).format();
                close = moment(`${date} 23:00`, 'YYYY-MM-DD HH:mm a', `${this.config.Timezone}`).format();
                state = scheduleType.operating;
              // Park is operating as normal
              } else {
                name = 'Open';
                state = scheduleType.operating;
                open = moment(`${date} ${json.opening_hours[key].mo_time}`, 'YYYY-MM-DD HH:mm a', `${this.config.Timezone}`).format();
                close = moment(`${date} ${json.opening_hours[key].mc_time}`, 'YYYY-MM-DD HH:mm a', `${this.config.Timezone}`).format();
              }

              // Set the hours object
              const hourobj = {
                name: name,
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

export default CDABase;
