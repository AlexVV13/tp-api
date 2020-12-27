// Dummy park which is the base of all parks basically.
import moment from 'moment-timezone';
import fetch from 'node-fetch';
import fs from 'fs';

import dotenv from 'dotenv';
dotenv.config();

/**
* Dummy Park Object
*/
export class Dummy {
  /**
   * Create a new Dummy Park object
   * @param {object} options
   */
  constructor() {
    this.name = 'Dummy';

    this.latutude = 48.266140769976715;
    this.longitude = 7.722050520358709;

    this.timezone = 'Europe/Amsterdam';

    this.apiKey = process.env.DUMMY_API_KEY;
    this.waitTimesURL = process.env.DUMMY_WAITTIMES_URL;

    this.language = process.env.LANGUAGE;
  }

  // Load the Dummy poidata
  // const poidata = ('./data/parks/dummy/dummy_pois.json');
  // const poimock = ('./data/parks/dummy/dummy_poi_mock.json');

  /**
  * Get Dummy POI data
  * This data contains general ride names, descriptions etc.
  */
  async getPOIS() {
    return fetch(this.waitTimesURL,
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
          // Fetch POI DATA
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
          fs.writeFile('./data/parks/efteling/efteling_pois.json', JSON.stringify(poi, null, 4), function(err) {
            if (err) return console.log(err);
          });
          fs.writeFile('./data/parks/efteling/efteling_poi_mock.json', JSON.stringify(rideData.hits.hit, null, 4), function(err) {
            if (err) return console.log(err);
          });
          return Promise.resolve(poi);
        });
  }

  /**
  * Get Dummy Park Hours data
  * This data contains the hours data, used to display the operating hours of Dummy
  */
  async getOpHours() {
    const currentYear = moment().format('YYYY');
    const currentMonth = moment().format('MM');

    return fetch(
        this.waitTimesURL +
        `${currentYear}/${currentMonth}`,
        {
          method: 'GET',
        },
    )
        .then((res) => res.json())
        .then((json) => {
          const Calendar = [];
          // Fetch Cal data
          return Promise.resolve(Calendar);
        });
  }

  /**
  * Get All Dummy data in console
  * This data contains all the data of Dummy, returned as json object
  */
  async getData() {
    return await Promise.all([this.getQueue(), this.getOpHours()]).then((rides) => {
      console.log(JSON.stringify(rides, null, 4));
    });
  }

  /**
  * Get Dummy Park Hours data in console
  * This data contains the hours data, used to display the operating hours of Dummy
  */
  async getCalendar() {
    return await this.getOpHours().then((calendar) => {
      console.log(calendar);
    });
  }

  /**
  * Get Dummy Queuetimes data in console
  * This data contains the queuetimes data, used to display the queuetimes of Dummy
  */
  async getWaitTime() {
    return await this.getQueue().then((rides) => {
      console.log(rides);
    });
  };
}

export default Dummy;

