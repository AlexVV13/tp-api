import CDABase from '../cdaparks/cdabase.js';

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
export class WalibiBelgium extends CDABase {
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
    options.supportswaittimes = true;
    options.supportsschedule = false;
    options.supportsrideschedules = false;
    options.fastPass = true;
    options.FastPassReturnTimes = false;

    // API options
    options.apiBase = options.apiBase || process.env.WALIBIBELGIUM_APIBASE;

    // Language settings
    options.languages = options.languages || process.env.LANGUAGES;

    options.langoptions = options.langoptions || `{'en', 'de', 'nl'}`;

    super(options);
  }
}

export default WalibiBelgium;
