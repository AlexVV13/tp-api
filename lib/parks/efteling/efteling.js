import moment from 'moment-timezone';
import fetch from 'node-fetch';
import {Park} from '../park.js';
// import fs from 'fs';

import dotenv from 'dotenv';
dotenv.config();

/**
* Efteling Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* Most park specific parameters are set already
* @class
*/
export class Efteling extends Park {
  /**
  * Create a new Efteling Park object
  * @param {object} options
  */
  constructor(options = {}) {
    options.name = options.name || 'Efteling';
    options.timezone = options.timezone || 'Europe/Amsterdam';

    // Setting the parks entrance as it's default location
    options.latitude = 51.65098350641645;
    options.longitude = 5.049916835374731;

    options.apiKey = options.apiKey || process.env.EFTELING_API_KEY;

    options.searchURL = options.searchURL || process.env.EFTELING_SEARCH_URL;
    options.waitTimesURL = options.waitTimesURL || process.env.EFTELING_WAITTIMES_URL;
    options.histURL = options.histURL || process.env.EFTELING_HIST_URL;

    options.languages = options.languages || process.env.LANGUAGES;

    options.langoptions = options.langoptions || `{'en', 'fr', 'de', 'nl'}`;

    super(options);

    if (!this.config.searchURL) throw new Error('Missing Efteling search url!');
    if (!this.config.apiKey) throw new Error('Missing Efteling apiKey!');
    if (!this.config.waitTimesURL) throw new Error('Missing Efteling waittimes url!');
    if (!this.config.histURL) throw new Error('Missing Efteling Operating Hours url!');
    if (!this.config.languages) {
      this.config.languages = 'en';
    };
  }

  // Load the Efteling poidata
  // const poidata = ('./data/parks/efteling/efteling_pois.json');
  // const poimock = ('./data/parks/efteling/efteling_poi_mock.json');

  /**
  * Get Efteling POI data
  * This data contains general ride names, descriptions etc.
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Efteling();
  *
  * park.getPois().then((pois) => {
  * console.log(pois)
  * });
  * @return {string} All Efteling POIS without queuetimes
  */
  async getPOIS() {
    return fetch(this.config.searchURL +
      `search?q.parser=structured&size=1000&q=(and (phrase field%3Dlanguage '$${this.config.languages}'))`,
    {
      method: 'GET',
      headers: {
        Authorization: this.config.apiKey,
      },
    },
    )
        .then((res) => res.json())
        .then((rideData) => {
          const poi = {};
          let fastPass = 'false'; // Set FastPass to false as default
          let singlerider = 'false'; // Let singlerider be false as default
          rideData.hits.hit.forEach((ride) => {
            if (ride.fields.category === 'attraction' && ride.fields.hide_in_app !== 'false') {
              if (ride.fields.alternateid && ride.fields.alternateid.indexOf('singlerider')) {
                singlerider = 'true'; // Initial single rider implementation
              } else {
                singlerider = 'false';
              }

              if (ride.fields.name == 'Python') { // Not doing too much here, since Python is the only fp ride here.
                fastPass = 'true';
              }
              // Split the language specific part out
              const ids = ride.id;
              const idSplit = ids.split('-');
              const id = idSplit[0];
              // Split latlon
              const latlon = ride.fields.latlon;
              const latlonSplit = latlon.split(',');
              const lat = latlonSplit[0];
              const lon = latlonSplit[1];

              // Efteling actually provides some tags in their api
              const tags = ride.fields.properties;

              // Poi Object
              poi[id] = {
                name: ride.fields.name,
                id: id,
                waitTime: null,
                state: null,
                active: null,
                location: {
                  latitude: lat,
                  longitude: lon,
                },
                meta: {
                  single_rider: singlerider,
                  fastPass: fastPass,
                  type: ride.fields.category,
                  area: ride.fields.empire,
                  tags: tags,
                },
              };
            }
          });
          return Promise.resolve(poi);
        });
  }

  /**
  * Get Efteling QueueTimes data
  * This data contains the queue data, we'll assign them to the earlier fetched pois
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Efteling();
  *
  * park.getQueue().then((queue) => {
  * console.log(queue)
  * });
  * @return {string} All Efteling POIS with queuetimes
  */
  async getQueue() {
    return await this.getPOIS().then((rideData) => fetch(this.config.waitTimesURL,
        {
          method: 'GET',
        },
    )
        .then((res) => res.json())
        .then((json) => {
          const rides = [];
          // Park is closed, and nothing is returned, attach that here.
          if (!json.AttractionInfo.length) {
            Object.keys(rideData).forEach((ride) => {
            // Update the variables to the closed rides
              rideData[ride].waitTime = '0';
              rideData[ride].state = 'Closed';
              rideData[ride].active = 'false';
              // Create the ride Object
              const rideobj = {
                name: rideData[ride].name,
                id: 'Efteling_' + rideData[ride].id,
                waitTime: rideData[ride].waitTime,
                state: rideData[ride].state,
                active: rideData[ride].active,
                location: {
                  latitude: rideData[ride].location.latitude,
                  longitude: rideData[ride].location.longitude,
                },
                meta: {
                  type: rideData[ride].meta.type,
                  area: rideData[ride].meta.area,
                  single_rider: rideData[ride].meta.single_rider,
                  fastPass: rideData[ride].meta.fastPass,
                  tags: rideData[ride].meta.tags,
                },
              };
              rides.push(rideobj);
            });

            return Promise.resolve(rides);
          }

          // If there are rides listed, fetch them here.
          json.AttractionInfo.forEach((ridetime) => {
            // Fetch Rides when park is open
          });
        }),
    );
  };

  /**
  * Get Efteling Park Hours data
  * This data contains the hours data, used to display the operating hours of Efteling
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Efteling();
  *
  * park.getOpHours().then((hours) => {
  * console.log(hours)
  * });
  * @return {string} All Efteling Operating Hours for 1mo
  */
  async getOpHours() {
    const currentYear = moment().format('YYYY');
    const currentMonth = moment().format('MM');

    return fetch(
        this.config.histURL +
        `${currentYear}/${currentMonth}`,
        {
          method: 'GET',
        },
    )
        .then((res) => res.json())
        .then((json) => {
          const Calendar = [];
          if (!json.OpeningHours.length) {
          // Park is closed, do nothing but returning today as empty string
            const hours = {
              date: moment().format('YYYY-MM-DD'),
              type: 'Closed',
              openingTime: moment('23:59', 'HH:mm a').format(),
              closingTime: moment('23:59', 'HH:mm a').format(),
              special: [],
            };
            Calendar.push(hours);
          } else {
          // Return the actual opening hours
            json.OpeningHours.forEach((cal) => {
              let date = moment.tz(`${cal.Date}`, 'YYYY-MM-DD', 'Europe/Amsterdam');
              date = moment(date).format('YYYY-MM-DD');
              cal.OpeningHours.forEach((cal1) => {
                let open = moment.tz(`${date}${cal1.Open}`, 'YYYY-MM-DDHH:mm', 'Europe/Amsterdam');
                open = moment(open).format();
                let close = moment.tz(`${date}${cal1.Close}`, 'YYYY-MM-DDHH:mm', 'Europe/Amsterdam');
                close = moment(close).format();
                const type = 'Operating';

                const hours = {
                  closingTime: close,
                  openingTime: open,
                  type: type,
                  special: [],
                  date: date,
                };
                Calendar.push(hours);
              });
            });
          };
          return Promise.resolve(Calendar);
        });
  }
};

export default Efteling;

