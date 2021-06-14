import moment from 'moment-timezone';
import fetch from 'node-fetch';
import {Park} from '../park.js';

import dotenv from 'dotenv';
dotenv.config();

/**
* Hansa-Park Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* Most park specific parameters are set already
* @class
*/
export class HansaPark extends Park {
  /**
  * Create a new Hansa-Park Park object
  * @param {object} options
  */
  constructor(options = {}) {
    options.name = 'Hansa-Park';
    options.timezone = 'Europe/Berlin';

    // Setting the parks entrance as it's default location
    options.latitude = 0.00;
    options.longitude = 0.00;

    // Options for our park Object
    options.supportswaittimes = true;
    options.supportsschedule = true;
    options.supportsrideschedules = true;
    options.fastPass = false;
    options.FastPassReturnTimes = false;

    // Api options
    options.waitTimesURL = process.env.HANSAPARK_WAITTIMES_URL;
    options.hoursURL = process.env.HANSAPARK_HIST_URL;

    // Language options
    options.languages = process.env.LANGUAGES;

    options.langoptions = `{'en', 'de'}`;

    super(options);

    // Check for existance
    if (!this.config.waitTimesURL) throw new Error('Missing Hansa-Park waittimes url!');
    if (!this.config.hoursURL) throw new Error('Missing Hansa-Park Operating Hours url!');
    if (!this.config.languages) {
      this.config.languages = 'en';
    };
  }

  /**
  * Get Hansa-Park QueueTimes data
  * This data contains the queue data, we'll assign them to the earlier fetched pois
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Hansa-Park();
  *
  * park.getQueue().then((queue) => {
  * console.log(queue)
  * });
  * @return {string} All Hansa-Park POIS with queuetimes
  */
  async getQueue() {
    return fetch(this.config.waitTimesURL,
        {
          method: 'GET',
        },
    )
        .then((res) => res.json())
        .then((json) => {
          console.log(json);
        });
  };

  /**
  * Get Hansa-Park Park Hours data
  * This data contains the hours data, used to display the operating hours of Hansa-Park
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Hansa-Park();
  *
  * park.getOpHours().then((hours) => {
  * console.log(hours)
  * });
  * @return {string} All Hansa-Park Operating Hours for 1mo
  */
  async getOpHours() {
    const currentYear = moment().format('YYYY');
    const currentMonth = moment().format('MM');

    return fetch(
        this.config.hoursURL +
        `&month=${currentMonth}&year=${currentYear}&offset=1`,
        {
          method: 'GET',
        },
    )
        .then((res) => res.json())
        .then((json) => {
          console.log(json);
        });
  }
};

export default HansaPark;
