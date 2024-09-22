import moment from 'moment-timezone';
import fetch from 'node-fetch';
import {Park} from '../park.js';
import {entityType, queueType} from '../types.js';

import dotenv from 'dotenv';
dotenv.config();

/**
* Parques Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* Most park specific parameters are set already
* @class
*/
export class Parques extends Park {
  /**
  * Create a new Parques Park object
  * @param {object} options
  */
  constructor(options = {}) {
    // Options for our park Object
    options.supportswaittimes = true;
    options.supportsschedule = false;
    options.supportsrideschedules = false;
    options.fastPass = true;
    options.FastPassReturnTimes = false;

    // Language settings
    options.languages = options.languages || process.env.LANGUAGES;

    options.langoptions = options.langoptions || `{'en', 'de', 'nl'}`;

    super(options);

    // Check for existance
    if (!this.config.apiUrl) throw new Error('Missing apiUrl!');
    if (!this.config.languages) {
      this.config.languages = 'en';
    };
  }

  /**
  * Get All POIS of Parques
  * This data contains all the POIS in Parques, limited to their fast-lane services
  * @return {string} All parques POIS with queuetimes
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
            let waitTime = 0;
            let state = queueType.closed;
            let active = false;
            if (ride.state === 'open') { // No virtQueue found, use the normal queue instead
              waitTime = Number(ride.minWait / 60); // Parques has some calculation issues or sth so divide our result by 60
              state = queueType.operating;
              active = true;
            } else if (ride.state === 'down' || ride.state === 'full' || ride.state === 'full_and_closed') { // Ride is listed as Down
              state = queueType.down;
              active = false;
            } else if (ride.state === 'not_operational' || ride.state === 'closed_indefinitely' || ride.state === 'closed') { // Ride is not operational (today?)
              state = queueType.closed;
              active = false;
            }

            const updated = moment(ride.bufferQueueLastModified).format();

            const fastPass = true; // All listed rides have fastPass

            // set location the hardcoded way because they're initially listed in a seperate api
            const lat = undefined;
            const lon = undefined;
            const area = undefined;

            // POI Object with queues
            const poiData = {
              name: ride.name,
              id: ride.shortId,
              status: state,
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
                descriptions: {
                  description: ride.description,
                  short_description: ride.description,
                },
              },
            };
            poi.push(poiData);
          });
          return Promise.resolve(poi);
        });
  }
}

// To Do: Operating Hours
export default Parques;
