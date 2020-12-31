import {EuropaParkBase} from './europaparkbase.js';

/**
* YULLBE Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* NOTE: Dutch language is supported, however strange things occur, such as deletion of VirtualLine entries making rides appear twice as 'normal'
*
* This class contains some login and refresh functions, but NEVER call them if you don't need them.
* Most park specific parameters are set already
* @class
*/
class Yullbe extends EuropaParkBase {
  /**
  * Create a new Yullbe Park object
  * @param {object} options
  */
  constructor(options = {}) {
    options.name = 'YULLBE';
    options.parkId = 'yullbe';
    options.timezone = 'Europe/Berlin';

    // Setting the parks entrance as latlon USING EP ENTRANCE SINCE YULLBE IS UNIVERSAL
    options.latitude = 48.266140769976715;
    options.longitude = 7.722050520358709;

    // Options for our park Object
    options.supportswaittimes = 'true';
    options.supportsschedule = 'true';
    options.supportsrideschedules = 'false';
    options.fastPass = 'true';
    options.FastPassReturnTimes = 'false';

    super(options);
  }
}

export default Yullbe;
