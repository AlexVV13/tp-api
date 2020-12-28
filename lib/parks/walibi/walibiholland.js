import moment from 'moment-timezone';
import fetch from 'node-fetch';
import {Park} from '../park.js';

import dotenv from 'dotenv';
dotenv.config();

/**
* Walibi Holland Park Object
*/
export class WalibiHolland extends Park {
  /**
  * Create a new Walibi Holland Park object
  * @param {object} options
  */
  constructor(options = {}) {
    options.name = options.name || 'Walibi Holland';
    options.timezone = options.timezone || 'Europe/Amsterdam';

    options.latitude = 52.4390338;
    options.longitude = 5.7665651;

    options.apiUrl = options.apiUrl || process.env.WALIBIHOLLAND_APIURL;
    options.apiBase = options.apiBase || process.env.WALIBIHOLLAND_APIBASE;

    options.languages = options.languages || process.env.LANGUAGES;

    options.langoptions = options.langoptions || `{'en', 'de', 'nl'}`;

    super(options);

    if (!this.config.apiUrl) throw new Error('Missing Walibi Holland apiUrl!');
    if (!this.config.apiBase) throw new Error('Missing Walibi Holland apiBase!');
    if (!this.config.languages) {
      this.config.languages = 'en';
    };
  }

  // Load the Walibi Holland poidata
  // const poidata = ('./data/parks/walibi/walibiholland_pois.json')
  // const poimock = ('./data/parks/walibi/walibiholland_poi_mock.json')

  /**
  * Get All POIS of Walibi Holland
  * This data contains all the POIS in Walibi Holland, limited to their fast-lane services
  */
  async getQueue() {
    return fetch(this.config.apiUrl,
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
                id: 'WalibiHolland_' + ride.shortId,
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

export default WalibiHolland;
