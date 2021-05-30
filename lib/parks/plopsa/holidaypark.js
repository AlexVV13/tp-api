import PlopsaBase from './plopsabase.js';

import dotenv from 'dotenv';
dotenv.config();

/**
* Holiday Park Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* Most park specific parameters are set already
* @class
*/
export class HolidayPark extends PlopsaBase {
  /**
  * Create a new Holiday Park Park object
  * @param {object} options
  */
  constructor(options = {}) {
    options.name = 'Holiday Park';
    options.timezone = 'Europe/Berlin';

    // Set the parking's entrance as the parks default location
    options.latitude = 49.317787;
    options.longitude = 8.300378;

    // Options for our park Object
    options.supportswaittimes = true;
    options.supportsschedule = false;
    options.supportsrideschedules = false;
    options.fastPass = true;
    options.FastPassReturnTimes = false;

    // API options
    options.apiBase = process.env.HOLIDAY_APIBASE;
    options.apiId = process.env.HOLIDAY_APIID;

    // Language settings
    options.languages = process.env.LANGUAGES;

    options.langoptions = `{'en', 'de', 'nl'}`;

    super(options);
  }
}

export default HolidayPark;
