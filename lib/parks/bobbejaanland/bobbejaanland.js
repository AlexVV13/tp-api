import moment from 'moment-timezone';
import fetch from 'node-fetch';
import {Park} from '../park.js';
import {entityType, queueType} from '../types.js';

import dotenv from 'dotenv';
dotenv.config();

/**
* Bobbejaanland Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* Most park specific parameters are set already
* @class
*/
export class Bobbejaanland extends Park {
  /**
  * Create a new Bobbejaanland Park object
  * @param {object} options
  */
  constructor(options = {}) {
    options.name = options.name || 'Bobbejaanland';
    options.timezone = options.timezone || 'Europe/Brussels';

    // Setting the cute fountain at the entrance as parks location
    options.latitude = 0.00000;
    options.longitude = 0.00000;

    // Options for our park Object
    options.supportswaittimes = true;
    options.supportsschedule = false;
    options.supportsrideschedules = false;
    options.fastPass = true;
    options.FastPassReturnTimes = false;

    // API options
    options.apiUrl = options.apiUrl || process.env.BOBBEJAANLAND_APIURL;
    options.apiBase = options.apiBase || process.env.BOBBEJAANLAND_APIBASE;

    // Language settings
    options.languages = options.languages || process.env.LANGUAGES;

    options.langoptions = options.langoptions || `{'en', 'de', 'nl'}`;

    super(options);

    // Check for existance
    if (!this.config.apiUrl) throw new Error('Missing Bobbejaanland apiUrl!');
    if (!this.config.apiBase) throw new Error('Missing Bobbejaanland apiBase!');
    if (!this.config.languages) {
      this.config.languages = 'en';
    };
  }

  /**
  * Get All POIS of Bobbejaanland
  * This data contains all the POIS in Bobbejaanland, limited to their fast-lane services
  * @return {string} All Bobbejaanland POIS with queuetimes
  */
  async getQueue() {
    return fetch(this.config.apiUrl,
        {
          method: 'GET',
        },
    )
    .then((res) => res.json())
    .then((rideData) => {
      const poi = [];
      rideData.forEach((ride) => {
        let waitTime = ride.minWait / 60; // Accesso uses another calculation method, divide by 60
        let state = queueType.operating;
        let active = true;
          if (ride.state === 'closed_indefinitely') { // Ride is listed as Down, however, when all rides are closing for the night, it has the same status.
            state = queueType.down;
            active = false;
            waitTime = 0;
          } else if (ride.state === 'not_operational') { // Ride is not operational (today?)
            state = queueType.closed;
            active = false;
            waitTime = 0;
          }
          // Declare other states when park reopens

          const updated = moment(ride.bufferQueueLastModified).format();

          const fastPass = true; // All listed rides have fastPass

          // set location the hardcoded way because they're initially listed in a seperate api
          const lat = undefined;
          const lon = undefined;
          const area = undefined;

          // POI Object with queues
          const poiData = {
            name: ride.name,
            id: 'Bobbejaanland_' + ride.shortId,
            state: state,
            active: active,
            waitTime: waitTime,
            changedAt: updated,
            location: {
              latitude: lat,
              longitude: lon,
              area: area,
            },
            meta: {
              type: entityType.ride,
              fastPass: fastPass,
            },
          };
          poi.push(poiData);
      });
      return Promise.resolve(poi);
    });
  }

  /**
  * Get All Operating Hours of Bobbejaanland
  * This data contains all the Operating Hours in Bobbejaanland fetched with currentyear.
  * @return {string} All Bobbejaanland calendar data
  */
  async getOpHours() {
    return fetch()
    .then((res) => res.json())
    .then((json) => {
    });
  };
}

export default Bobbejaanland;
