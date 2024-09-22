import {Parques} from './parques.js';

/**
* Movie-Park Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* Most park specific parameters are set already
* @class
*/
class MoviePark extends Parques {
  /**
  * Create a new EuropaPark Park object
  * @param {object} options
  */
  constructor(options = {}) {
    options.name = options.name || 'Movie-Park';
    options.timezone = options.timezone || 'Europe/Berlin';

    // Setting the cute fountain at the entrance as parks location
    options.latitude = 0.00000;
    options.longitude = 0.00000;

    // Options for our park Object
    options.supportswaittimes = true;
    options.supportsschedule = true;
    options.supportsrideschedules = false;
    options.fastPass = true;
    options.FastPassReturnTimes = false;

    // API options
    options.apiUrl = options.apiUrl || process.env.MPG_APIURL;

    super(options);
  }
}

export default MoviePark;
