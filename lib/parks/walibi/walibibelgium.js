import moment from 'moment-timezone';
import fetch from 'node-fetch';
import {Park} from '../park.js';

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
export class WalibiBelgium extends Park {
  /**
  * Create a new Walibi Belgium Park object
  * @param {object} options
  */
  constructor(options = {}) {
    options.name = options.name || 'Walibi Belgium';
    options.timezone = options.timezone || 'Europe/Brussels';

    // Set the parking's entrance as the parks default location
    options.latitude = 50.7038852;
    options.longitude = 4.5960371;

    // Options for our park Object
    options.supportswaittimes = 'true';
    options.supportsschedule = 'false';
    options.supportsrideschedules = 'false';
    options.fastPass = 'true';
    options.FastPassReturnTimes = 'false';

    // API options
    options.apiBase = options.apiBase || process.env.WALIBIBELGIUM_APIBASE;

    // Language settings
    options.languages = options.languages || process.env.LANGUAGES;

    options.langoptions = options.langoptions || `{'en', 'de', 'nl'}`;

    super(options);

    // Check for existance
    if (!this.config.apiBase) throw new Error('Missing Walibi Belgium apiBase!');
    if (!this.config.languages) {
      this.config.languages = 'en';
    };
  }

  // Load the Walibi Belgium poidata
  // const poidata = ('./data/parks/walibi/walibiBelgium_pois.json')
  // const poimock = ('./data/parks/walibi/walibiBelgium_poi_mock.json')

  /**
  * Get All POIS of Walibi Belgium
  * This data contains all the POIS in Walibi Belgium, limited to their fast-lane services
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.WalibiBelgium();
  *
  * park.getPois().then((pois) => {
  * console.log(pois)
  * });
  * @return {string} All Walibi Belgium POIS with queuetimes
  */
  async getQueue() {
    return fetch(this.config.apiBase +
      '/entertainments',
    {
      method: 'GET',
    },
    )
        .then((res) => res.json())
        .then((rideData) => {
          const poi = [];
          rideData.entertainment.forEach((ride) => {
            let waitTime = null;
            let active = null;
            let state = null;

            if (ride.waitingTime == -10) {
              waitTime = '0';
              state = 'Closed';
              active = 'false';
            } else {
              waitTime = ride.waitingTime;
              state = 'Operating';
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
              id: 'WalibiBelgium' + ride.uuid,
              state: state,
              active: active,
              waitTime: waitTime,
              location: {
                latitude: ride.location.lat,
                longitude: ride.location.lon,
              },
              meta: {
                category: ride.category.name,
                type: 'attraction',
                restrictions: {
                  minHeight: minHeight,
                  minHeightCompanion: minHeightCompanion,
                },
              },
            };
            poi.push(poiData);
          });
          return Promise.resolve(poi); // Although we saved them in a json file, we'll just return them for the queue attach function which will run next if you called getQueue()
        });
  }

  /**
  * Get All Operating Hours of Walibi Belgium
  * This data contains all the Operating Hours in Walibi Belgium, fetched with currentyear.
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.WalibiBelgium();
  *
  * park.getOpHours().then((hours) => {
  * console.log(hours)
  * });
  * @return {string} All Walibi Belgium calendar data
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

export default WalibiBelgium;
