import moment from 'moment-timezone';
import fetch from 'node-fetch';
// import fs from 'fs';

import dotenv from 'dotenv';
dotenv.config();

/**
* Efteling Park Object
*/
export class Efteling {
  /**
   * Create a new Efteling Park object
   * @param {object} options
   */
  constructor() {
    this.name = 'Efteling';

    // Set the parks entrance as it's default location
    this.latutude = 51.65098350641645;
    this.longitude = 5.049916835374731;

    this.timezone = 'Europe/Amsterdam';

    // Load the .ENV variables here
    this.searchURL = process.env.EFTELING_SEARCH_URL;
    this.apiKey = process.env.EFTELING_API_KEY;
    this.waitTimesURL = process.env.EFTELING_WAITTIMES_URL;
    this.histURL = process.env.EFTELING_HIST_URL;

    // New Lang Variable, this is hard since os'es exports these itself (Windows uses LANG, Linux language etc)
    this.languages = process.env.LANGUAGES;

    if (!this.searchURL) throw new Error('Missing Efteling search url!');
    if (!this.apiKey) throw new Error('Missing Efteling apiKey!');
    if (!this.waitTimesURL) throw new Error('Missing Efteling waittimes url!');
    if (!this.histURL) throw new Error('Missing Efteling Operating Hours url!');
    if (!this.languages) {
      this.languages = 'en';
    }

    this.langoptions = `{'en', 'fr', 'de', 'nl'}`;
  }

  // Load the Efteling poidata
  // const poidata = ('./data/parks/efteling/efteling_pois.json');
  // const poimock = ('./data/parks/efteling/efteling_poi_mock.json');

  /**
  * Get Efteling POI data
  * This data contains general ride names, descriptions etc.
  * @return {string} All Efteling POIS without queuetimes
  */
  async getPOIS() {
    return fetch(this.searchURL +
      `search?q.parser=structured&size=1000&q=(and (phrase field%3Dlanguage '$${this.languages}'))`,
    {
      method: 'GET',
      headers: {
        Authorization: this.apiKey,
      },
    },
    )
        .then((res) => res.json())
        .then((rideData) => {
          const poi = {};
          let singlerider = 'false'; // Let singlerider be false as default
          rideData.hits.hit.forEach((ride) => {
            if (ride.fields.category === 'attraction' && ride.fields.hide_in_app !== 'false') {
              if (ride.fields.alternateid && ride.fields.alternateid.indexOf('singlerider')) {
                singlerider = 'true'; // Initial single rider implementation
              } else {
                singlerider = 'false';
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
                  type: ride.fields.category,
                  area: ride.fields.empire,
                },
              };
            }
          });
          /* fs.writeFile('./data/parks/efteling/efteling_pois.json', JSON.stringify(poi, null, 4), function(err) {
            if (err) return console.log(err);
          });
          fs.writeFile('./data/parks/efteling/efteling_poi_mock.json', JSON.stringify(rideData.hits.hit, null, 4), function(err) {
            if (err) return console.log(err);
          }); */
          return Promise.resolve(poi);
        });
  }

  /**
  * Get Efteling QueueTimes data
  * This data contains the queue data, we'll assign them to the earlier fetched pois
  * @return {string} All Efteling POIS with queuetimes
  */
  async getQueue() {
    return await this.getPOIS().then((rideData) => fetch(this.waitTimesURL,
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
  * @return {string} All Efteling Operating Hours for 1mo
  */
  async getOpHours() {
    const currentYear = moment().format('YYYY');
    const currentMonth = moment().format('MM');

    return fetch(
        this.histURL +
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

  /**
  * Get All Data of Efteling
  * This data contains all Efteling's data, which is fetched earlier
  * @return {string} all park data
  */
  async getData() {
    const rides = await this.getQueue();
    const hours = await this.getOpHours();

    const string = JSON.stringify({rides, hours}, null, 4);

    return Promise.resolve(string);
  }

  /**
  * Get All Calendar Data of Efteling
  * This data contains all the calendar data of Efteling
  * @return {string} operating hours
  */
  getCalendar() {
    return this.getOpHours().then((hours) => Promise.resolve(hours));
  }

  /**
  * Get All Queues of Efteling
  * This data contains all the Queues in Efteling
  * @return {string} WaitTimes
  */
  getWaitTime() {
    return this.getQueue().then((rides) => Promise.resolve(rides));
  }
};

export default Efteling;

