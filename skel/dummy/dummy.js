import moment from 'moment-timezone';
import fetch from 'node-fetch';
import {Park} from '../park.js';

import dotenv from 'dotenv';
dotenv.config();

/**
* Dummy Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* Most park specific parameters are set already
* @class
*/
export class Dummy extends Park {
  /**
  * Create a new Dummy Park object
  * @param {object} options
  */
  constructor(options = {}) {
    options.name = options.name || 'Dummy';
    options.timezone = options.timezone || 'Europe/Amsterdam';

    // Park's entrance mostly, but if you really need it you could also pick the center of the park (i.e. Central Plaza in Disneyland)
    options.latitude = 52.4390338;
    options.longitude = 5.7665651;

    // Options for our park Object
    options.supportswaittimes = 'true';
    options.supportsschedule = 'false';
    options.supportsrideschedules = 'false';
    options.fastPass = 'true';
    options.FastPassReturnTimes = 'false';

    // Api options
    options.apiUrl = options.apiUrl || process.env.DUMMY_APIURL;
    options.apiKey = options.apiBase || process.env.DUMMY_APIKEY;

    options.languages = options.languages || process.env.LANGUAGES;

    // What languages does this API support?
    options.langoptions = options.langoptions || `{'en', 'de', 'nl', 'es'}`;

    super(options);

    if (!this.config.apiUrl) throw new Error('Missing Dummy apiUrl!');
    if (!this.config.apiKey) throw new Error('Missing Dummy apiKey!');
    if (!this.config.languages) {
      this.config.languages = 'en';
    };
  }

  // Load the Dummy poidata
  // const poidata = ('./data/parks/dummy/dummy_pois.json')
  // const poimock = ('./data/parks/dummy/dummy_poi_mock.json')

  // Some parks have a seperate queue api, create an getPoi() function before the getQueue() function in that case.
  /**
  * Get All POIS of Dummy
  * This data contains all the POIS in Dummy, limited to their fast-lane services
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Dummy();
  *
  * park.getPois().then((pois) => {
  * console.log(pois)
  * });
  * @return {string} All Dummy POIS without queuetimes
  */
  /* async getPOIS() {
    return fetch(this.config.apiUrl,
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
          return Promise.resolve(poi);
        });
  } */


  /**
  * Get All POIS of Dummy
  * This data contains all the POIS in Dummy, limited to their fast-lane services
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Dummy();
  *
  * park.getPois().then((pois) => {
  * console.log(pois)
  * });
  * @return {string} All Dummy POIS with queuetimes
  */
  async getQueue() {
    // If getPOIS() is set: return await this.getPOIS().then((rideData) => fetch(this.config.apiUrl,
    return fetch(this.config.apiUrl,
        {
          method: 'GET',
        },
    )
        .then((res) => res.json())
        .then((rideData) => {
          const poi = [];
          rideData.forEach((ride) => {
            return Promise.resolve(poi); // Return the pois
          });
        });
  };

  /**
  * Get All Operating Hours of Dummy
  * This data contains all the Operating Hours in Dummy, fetched with currentyear.
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Dummy();
  *
  * park.getOpHours().then((hours) => {
  * console.log(hours)
  * });
  * @return {string} All Dummy calendar data
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

export default Dummy;
