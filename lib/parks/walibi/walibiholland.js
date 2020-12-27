import moment from 'moment-timezone';
import fetch from 'node-fetch';
import fs from 'fs';

import dotenv from 'dotenv';
dotenv.config();

/**
* Walibi Holland Park Object
*/
export class WalibiHolland {
  /**
   * Create a new WalibiHolland Park object
   * @param {object} options
   */
  constructor() {
    this.name = 'Walibi Holland';

    // I'll just use their fountain at the entrance for this
    this.latutude = 52.4390338;
    this.longitude = 5.7665651;

    this.timezone = 'Europe/Amsterdam';

    this.apiUrl = process.env.WALIBIHOLLAND_APIURL;
    this.apiBase = process.env.WALIBIHOLLAND_APIBASE;

    this.language = process.env.LANGUAGE;

    if (!this.apiUrl) throw new Error('Missing Walibi Holland search url!');
    if (!this.apiBase) throw new Error('Missing Walibi Holland apiKey!');
    if (!this.language) {
      this.language = 'en';
    }
  }

  // Load the Walibi Holland poidata
  // const poidata = ('./data/parks/walibi/walibiholland_pois.json')
  // const poimock = ('./data/parks/walibi/walibiholland_poi_mock.json')

  /**
  * Get All POIS of Walibi Holland
  * This data contains all the POIS in Walibi Holland, limited to their fast-lane services
  */
  async getPOIS() {
    return fetch(this.apiUrl,
        {
          method: 'GET',
        },
    )
        .then((res) => res.json())
        .then((rideData) => {
          const poi = [];
          rideData.forEach((ride) => {
            let waitTime = '0';
            let state = 'Closed';
            let active = 'false';
            if (ride.name !== 'Dummy1') { // They have a dummy ride to sell single shots in their fast-lane, mind=blown
              if (ride.useVirtualQueue == 'true') { // VirtQueue enabled
                waitTime = Math.round(ride.waitTimeMins); // Stupid API serves random numbers like 0.00010358, let's round them.
              } else { // No virtQueue found, use the normal queue instead
                waitTime = ride.minWait / 60; // Walibi has some calculation issues or sth so divide our result by 60
              }
              if (ride.state === 'closed_indefinitely') { // Closed but not closed but still closed
                state = 'Closed';
                active = 'false';
              } // Declare other states when park reopens
              // POI Object with queues
              const poiData = {
                name: ride.name,
                id: ride.shortId,
                state: state,
                active: active,
                waitTime: waitTime,
                meta: {
                  type: 'attraction',
                },
              };
              poi.push(poiData);
            }
          });
          fs.writeFile('./data/parks/walibi/walibiholland_pois.json', JSON.stringify(poi, null, 4), function(err) {
            if (err) return console.log(err);
          });
          fs.writeFile('./data/parks/walibi/walibiholland_poi_mock.json', JSON.stringify(rideData, null, 4), function(err) {
            if (err) return console.log(err);
          });
          return Promise.resolve(poi); // Although we saved them in a json file, we'll just return them for the queue attach function which will run next if you called getQueue()
        });
  }

  /**
  * Get All Operating Hours of Walibi Holland
  * This data contains all the Operating Hours in Walibi Holland, fetched with currentyear.
  */
  async getOpHours() {
    const currentYear = moment().format('YYYY');
    return fetch(
        this.apiBase +
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

  /**
  * Get All Data of Walibi Holland
  * This data contains all Walibi's data, which is fetched earlier
  */
  async getData() {
    return await Promise.all([this.getPOIS(), this.getOpHours()]).then((rides) => {
      console.log(JSON.stringify(rides, null, 4));
    });
  }

  /**
  * Get All Calendar Data of Walibi Holland
  * This data contains all the calendar data of Walibi Holland
  */
  async getCalendar() {
    return await this.getOpHours().then((calendar) => {
      console.log(calendar);
    });
  }

  /**
  * Get All Queues of Walibi Holland
  * This data contains all the Queues in Walibi Holland, limited to their fast-lane services
  */
  async getWaitTime() {
    return await this.getPOIS().then((rides) => {
      console.log(rides);
    });
  }
};

export default WalibiHolland;
