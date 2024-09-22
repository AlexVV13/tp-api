import moment from 'moment-timezone';
import fetch from 'node-fetch';
import {Park} from '../park.js';
import {entityType, queueType} from '../types.js';

import dotenv from 'dotenv';
dotenv.config();

/**
* Walibi Holland Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* Most park specific parameters are set already
* @class
*/
export class WalibiHolland extends Park {
  /**
  * Create a new Walibi Holland Park object
  * @param {object} options
  */
  constructor(options = {}) {
    options.name = options.name || 'Walibi Holland';
    options.timezone = options.timezone || 'Europe/Amsterdam';

    // Setting the cute fountain at the entrance as parks location
    options.latitude = 52.4390338;
    options.longitude = 5.7665651;

    // Options for our park Object
    options.supportswaittimes = true;
    options.supportsschedule = false;
    options.supportsrideschedules = false;
    options.fastPass = true;
    options.FastPassReturnTimes = false;

    // API options
    options.apiUrl = options.apiUrl || process.env.WALIBIHOLLAND_APIURL;
    options.apiBase = options.apiBase || process.env.WALIBIHOLLAND_APIBASE;
    options.apiKey = process.env.APIKEYWBN;

    // Language settings
    options.languages = options.languages || process.env.LANGUAGES;

    options.langoptions = options.langoptions || `{'en', 'de', 'nl'}`;

    super(options);

    // Check for existance
    if (!this.config.apiUrl) throw new Error('Missing Walibi Holland apiUrl!');
    if (!this.config.apiBase) throw new Error('Missing Walibi Holland apiBase!');
    if (!this.config.languages) {
      this.config.languages = 'en';
    };
  }

  /**
  * Get All POIS of Walibi Holland
  * This data contains all the POIS in Walibi Holland, limited to their fast-lane services
  * @return {string} All Walibi Holland POIS with queuetimes
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
            let waitTime = '0';
            let state = queueType.closed;
            let active = false;
            if (ride.name !== 'Dummy1') { // They have a dummy ride to sell single shots in their fast-lane, mind=blown
              if (ride.useVirtualQueue == true) { // VirtQueue enabled
                waitTime = Math.round(ride.waitTimeMins); // Stupid API serves random numbers like 0.00010358, let's round them.
                state = queueType.operating;
                active = true;
              } else { // No virtQueue found, use the normal queue instead
                waitTime = ride.minWait / 60; // Walibi has some calculation issues or sth so divide our result by 60
                state = queueType.operating;
                active = true;
              }
              if (ride.state === 'closed_indefinitely') { // Ride is listed as Down, however, when all rides are closing for the night, it has the same status lol.
                state = queueType.down;
                active = false;
              } else if (ride.state === 'not_operational') { // Ride is not operational (today?)
                state = queueType.closed;
                active = false;
              }
              // Declare other states when park reopens

              const updated = moment(ride.bufferQueueLastModified).format();

              let fastPass = false;
              if (ride.useVirtualQueue === true || ride.useVirtualQueue === false) {
                fastPass = true;
              }
              // set location the hardcoded way because they're initially listed in a seperate api
              let lat = undefined;
              let lon = undefined;
              let area = undefined;
              if (ride.name === 'Lost Gravity') {
                lat = JSON.parse('52.442628');
                lon = JSON.parse('5.766199');
                area = 'Zero Zone';
              } else if (ride.name === 'El Rio Grande') {
                lat = JSON.parse('52.440264');
                lon = JSON.parse('5.764119');
                area = 'Exotic';
              } else if (ride.name === 'Goliath') {
                lat = JSON.parse('52.439853309732');
                lon = JSON.parse('5.7610387061724');
                area = 'Speedzone';
              } else if (ride.name === 'Untamed') {
                lat = JSON.parse('52.442665');
                lon = JSON.parse('5.761206');
                area = 'Wilderness';
              } else if (ride.name === 'Space Shot') {
                lat = JSON.parse('52.441688');
                lon = JSON.parse('5.761082');
                area = 'Speedzone';
              } else if (ride.name === 'Speed of Sound') {
                lat = JSON.parse('52.440535');
                lon = JSON.parse('5.767824');
                area = 'W.A.B. Plaza';
              } else if (ride.name === 'Xpress: Platform 13') {
                lat = JSON.parse('52.439772689391');
                lon = JSON.parse('5.7654926519984');
                area = 'Mainstreet';
              } else if (ride.name === 'Crazy River') {
                lat = JSON.parse('52.441924');
                lon = JSON.parse('5.764769');
                area = 'Zero Zone';
              } else if (ride.name === 'Condor') {
                lat = JSON.parse('52.440404970358');
                lon = JSON.parse('5.7618163417733');
                area = 'Exotic';
              } else if (ride.name === 'Blast') {
                lat = JSON.parse('52.441894');
                lon = JSON.parse('5.763487');
                area = 'Wilderness';
              }
              // POI Object with queues
              const poiData = {
                name: ride.name,
                id: 'WalibiHolland_' + ride.shortId,
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
                },
              };
              poi.push(poiData);
            }
          });
          return Promise.resolve(poi);
        });
  }
}

export default WalibiHolland;
