import PlopsaBase from './plopsabase.js';

import dotenv from 'dotenv';
dotenv.config();

/**
* Plopsaland de Panne Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* Most park specific parameters are set already
* @class
*/
export class PlopsalandDePanne extends PlopsaBase {
  /**
  * Create a new Plopsaland de Panne Park object
  * @param {object} options
  */
  constructor(options = {}) {
    options.name = 'Plopsaland de Panne';
    options.timezone = 'Europe/Brussels';

    // Set the parks entrance as the parks default location
    options.latitude = 51.080586;
    options.longitude = 2.600836;

    // Options for our park Object
    options.supportswaittimes = true;
    options.supportsschedule = false;
    options.supportsrideschedules = false;
    options.fastPass = true;
    options.FastPassReturnTimes = false;

    // API options
    options.apiBase = process.env.PLOPSALAND_APIBASE;
    options.apiId = process.env.PLOPSALAND_APIID;

    // Language settings
    options.languages = process.env.LANGUAGES;

    options.langoptions = `{'en'}`; // Support for nl, fr and de exist, however listed in seperate objects.

    super(options);
  }
}

export default PlopsalandDePanne;
