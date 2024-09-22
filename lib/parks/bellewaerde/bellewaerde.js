import {CDABase} from '../cdaparks/cdabase.js';

import dotenv from 'dotenv';
dotenv.config();

/**
* Bellewaerde Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* Most park specific parameters are set already
* @class
*/
export class Bellewaerde extends CDABase {
  /**
  * Create a new Walibi RA Park object
  * @param {object} options
  */
  constructor(options = {}) {
    options.name = 'Bellewaerde';
    options.timezone = 'Europe/Brussels';

    // Set the parking's entrance as the parks default location
    options.latitude = 50.846996;
    options.longitude = 2.947948;

    // Options for our park Object
    options.supportswaittimes = true;
    options.supportsschedule = true;
    options.supportsrideschedules = false;
    options.fastPass = true;
    options.FastPassReturnTimes = false;

    // API options
    options.apiBase = process.env.BELLEWAERDE_APIBASE;
    options.apiKey = process.env.APIKEYBWT;

    // Language settings
    options.languages = process.env.LANGUAGES;

    options.langoptions = `{'en', 'nl', 'fr'}`;

    super(options);
  }
}

export default Bellewaerde;
