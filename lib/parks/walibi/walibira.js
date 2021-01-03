import WalibiBase from './walibibase.js';

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
export class WalibiRA extends WalibiBase {
  /**
  * Create a new Walibi RA Park object
  * @param {object} options
  */
  constructor(options = {}) {
    options.name = options.name || 'Walibi Rhône-Alpes';
    options.timezone = options.timezone || 'Europe/Paris';

    // Set the parking's entrance as the parks default location
    options.latitude = 45.6198928;
    options.longitude = 5.5669562;

    // Options for our park Object
    options.supportswaittimes = 'true';
    options.supportsschedule = 'false';
    options.supportsrideschedules = 'false';
    options.fastPass = 'true';
    options.FastPassReturnTimes = 'false';

    // API options
    options.apiBase = options.apiBase || process.env.WALIBIRA_APIBASE;

    // Language settings
    options.languages = options.languages || process.env.LANGUAGES;

    options.langoptions = options.langoptions || `{'en', 'fr'}`;

    super(options);
  }
}

export default WalibiRA;
