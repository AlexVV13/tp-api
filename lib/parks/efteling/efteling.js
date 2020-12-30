import moment from 'moment-timezone';
import fetch from 'node-fetch';
import {queueType, entityType} from '../types.js';
import {Park} from '../park.js';

import dotenv from 'dotenv';
dotenv.config();

/**
* Efteling Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* Most park specific parameters are set already
* @class
*/
export class Efteling extends Park {
  /**
  * Create a new Efteling Park object
  * @param {object} options
  */
  constructor(options = {}) {
    options.name = 'Efteling';
    options.timezone = 'Europe/Amsterdam';

    // Setting the parks entrance as it's default location
    options.latitude = 51.65098350641645;
    options.longitude = 5.049916835374731;

    // Options for our park Object
    options.supportswaittimes = 'true';
    options.supportsschedule = 'true';
    options.supportsrideschedules = 'false';
    options.fastPass = 'true';
    options.FastPassReturnTimes = 'false';

    // Api options
    options.apiKey = process.env.EFTELING_API_KEY;

    options.searchURL = process.env.EFTELING_SEARCH_URL;
    options.waitTimesURL = process.env.EFTELING_WAITTIMES_URL;
    options.histURL = process.env.EFTELING_HIST_URL;

    // Language options
    options.languages = process.env.LANGUAGES;

    options.langoptions = `{'en', 'fr', 'de', 'nl'}`;

    super(options);

    // Check for existance
    if (!this.config.searchURL) throw new Error('Missing Efteling search url!');
    if (!this.config.apiKey) throw new Error('Missing Efteling apiKey!');
    if (!this.config.waitTimesURL) throw new Error('Missing Efteling waittimes url!');
    if (!this.config.histURL) throw new Error('Missing Efteling Operating Hours url!');
    if (!this.config.languages) {
      this.config.languages = 'en';
    };
  }

  /**
  * Get Efteling POI data
  * This data contains general ride names, descriptions etc.
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Efteling();
  *
  * park.getPois().then((pois) => {
  * console.log(pois)
  * });
  * @return {string} All Efteling POIS without queuetimes
  */
  async getPOIS() {
    return await this.cache.wrap('poidata', async () => {
      return fetch(this.config.searchURL +
        `search?q.parser=structured&size=1000&q=(and (phrase field%3Dlanguage '$${this.config.languages}'))`,
      {
        method: 'GET',
        headers: {
          Authorization: this.config.apiKey,
        },
      },
      )
          .then((res) => res.json())
          .then((data) => {
            if (!data) throw new Error('No PoiData received from Efteling!'); // We didn't get any data
            const poiData = {};

            data.hits.hit.forEach((hit) => {
              if (hit.hide_in_app === 'true') return; // We don't want data that isn't displayed anyway

              let singlerider = undefined;

              if (hit.fields.alternateid && hit.fields.alternateid.indexOf('singlerider') === 0) {
                singlerider = 'true';
              } else {
                singlerider = 'false';
              }
              // Base rides & pois
              if (hit.fields) {
                poiData[hit.fields.id] = {
                  singlerider: singlerider,
                  name: hit.fields.name,
                  id: hit.fields.id,
                  type: hit.fields.category,
                  properties: hit.fields.properties,
                  area: hit.fields.empire,
                  description: hit.fields.detail_text,
                  short_description: hit.fields.subtitle,
                  label: undefined,
                  category: hit.fields.targetgroups,
                };

                // Define The six Swans & Single Rider Queues
                if (hit.fields.alternateid && hit.fields.alternatelabel === 'Boat ride') {
                  poiData[hit.fields.alternateid] = {
                    singlerider: 'false',
                    name: hit.fields.name,
                    id: hit.fields.alternateid,
                    type: hit.fields.category,
                    properties: hit.fields.properties,
                    area: hit.fields.empire,
                    description: hit.fields.detail_text,
                    short_description: hit.fields.subtitle,
                    label: hit.fields.alternatelabel,
                    category: hit.fields.targetgroups,
                  };
                } else if (hit.fields.alternateid && hit.fields.alternateid.indexOf('singlerider')) {
                  poiData[hit.fields.id].singleRiderId = hit.fields.alternateid;
                  poiData[hit.fields.alternateid] = {
                    singlerider: 'true',
                    name: hit.fields.name + ' Single Rider',
                    id: hit.fields.alternateid,
                    type: hit.fields.category,
                    properties: hit.fields.properties,
                    area: hit.fields.empire,
                    description: hit.fields.detail_text,
                    short_description: hit.fields.subtitle,
                    label: hit.fields.alternatelabel,
                    category: hit.fields.targetgroups,
                  };
                }

                // Get the location tags
                if (hit.fields.latlon) {
                  const latsplit = /([0-9.]+),([0-9.]+)/.exec(hit.fields.latlon);
                  if (latsplit) {
                    poiData[hit.fields.id].location = {
                      latitude: Number(latsplit[1]),
                      longitude: Number(latsplit[2]),
                    };
                  }
                  if (latsplit && hit.fields.alternateid) {
                    poiData[hit.fields.alternateid].location = {
                      latitude: Number(latsplit[1]),
                      longitude: Number(latsplit[2]),
                    };
                  }
                }
              }
            });
            return poiData;
          });
    }, 1000 * 60 * 60 * 12 /* cache for 12 hours */);
  }

  /**
  * Build Efteling ride object
  * This data contains general ride names, descriptions etc.
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Efteling();
  *
  * park.buildRidePOI().then((pois) => {
  * console.log(pois)
  * });
  * @return {string} All Efteling ride POIS without queuetimes
  */
  async buildRidePOI() {
    const poiData = await this.getPOIS();

    if (!poiData) throw new Error('No PoiData for Efteling found!');
    const pois = {};
    let minHeightCM = undefined;
    let minHeightComp = undefined;
    let wet = undefined;
    let dizzyn = undefined;
    let preg = undefined;
    let weelchairtag = undefined;
    let familypoi = undefined;
    let thrillpoi = undefined;
    let youngpoi = undefined;
    let fastPass = undefined;
    Object.keys(poiData).forEach((poi) => {
      if (poiData[poi].id === 'dezeszwanenrondvaart' || poiData[poi].type === 'attraction') { // Yeah, somehow TSS is listed as fairytale.
        // Ugly Python FP Tweak
        if (poiData[poi].name === 'Python') {
          fastPass = 'true';
        } else {
          fastPass = 'false';
        }
        // Efteling tags
        if (poiData[poi].category) {
          const Thrill = poiData[poi].category.find((prop) => prop.indexOf('thrillseekers') === 0);
          const Young = poiData[poi].category.find((prop) => prop.indexOf('youngest-ones') === 0);
          const Family = poiData[poi].category.find((prop) => prop.indexOf('whole-family') === 0);

          if (Thrill !== undefined) {
            thrillpoi = 'Thrillseekers';
          } else {
            thrillpoi = undefined;
          }
          if (Young !== undefined) {
            youngpoi = 'Youngest_Ones';
          } else {
            youngpoi = undefined;
          }
          if (Family !== undefined) {
            familypoi = 'Family';
          } else {
            familypoi = undefined;
          }
        }

        if (poiData[poi].properties) {
          const minHeightProp = poiData[poi].properties.find((prop) => prop.indexOf('minimum') === 0);
          const minHeightComProp = poiData[poi].properties.find((prop) => prop.endsWith('undersupervision'));
          const maygetwet = poiData[poi].properties.find((prop) => prop.indexOf('wet') === 0);
          const weelchair = poiData[poi].properties.find((prop) => prop.indexOf('notaccessiblewheelchairs') === 0);
          const dizzyness = poiData[poi].properties.find((prop) => prop.indexOf('dizzy') === 0);
          const pregnant = poiData[poi].properties.find((prop) => prop.indexOf('pregnantwomen') === 0);
          if (minHeightProp !== undefined) {
            const minHeightNumber = Number(minHeightProp.slice(7));
            minHeightCM = minHeightNumber + ' cm';
          } else {
            minHeightCM = undefined;
          }

          if (minHeightComProp !== undefined) {
            const minHeightCompNumber = minHeightComProp.substring(0, 3);
            minHeightComp = minHeightCompNumber + ' cm';
          } else {
            minHeightComp = undefined;
          }

          if (maygetwet !== undefined) {
            wet = 'mayGetWet';
          } else {
            wet = undefined;
          }

          if (weelchair !== undefined) {
            weelchairtag = 'NotAccessibleWithWeelchair';
          } else {
            weelchairtag = undefined;
          }

          if (dizzyness !== undefined) {
            dizzyn = 'mayGetDizzy';
          } else {
            dizzyn = undefined;
          }

          if (pregnant !== undefined) {
            preg = 'UnsuitableForPregnantWomen';
          } else {
            preg = undefined;
          }
        }

        const restrictions = {
          minHeight: minHeightCM,
          minHeightAccompanied: minHeightComp,
        };

        pois[poiData[poi].id] = {
          name: poiData[poi].name,
          id: poiData[poi].id,
          waitTime: null,
          state: null,
          active: null,
          location: {
            area: poiData[poi].area,
            latitude: poiData[poi].location.latitude,
            longitude: poiData[poi].location.longitude,
          },
          meta: {
            category: [
              thrillpoi,
              youngpoi,
              familypoi,
            ],
            description: poiData[poi].description,
            label: poiData[poi].label,
            short_description: poiData[poi].short_description,
            single_rider: poiData[poi].singlerider,
            fastPass: fastPass,
            type: entityType.ride,
            tags: [
              wet,
              weelchairtag,
              dizzyn,
              preg,
            ],
            restrictions: restrictions,
          },
        };
      }
    });
    return Promise.resolve(pois);
  }

  /**
  * Build Efteling fairytale object
  * This data contains general fairytale names, descriptions etc.
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Efteling();
  *
  * park.buildFairyTalePOI().then((pois) => {
  * console.log(pois)
  * });
  * @return {string} All Efteling fairytale POIS
  */
  async buildFairytalePOI() {
    const poiData = await this.getPOIS();

    if (!poiData) throw new Error('No PoiData for Efteling found!');
    const pois = {};
    Object.keys(poiData).forEach((poi) => {
      if (poiData[poi].id === 'dezeszwanenrondvaart' || poiData[poi].type === 'fairytale') {
        pois[poiData[poi].id] = {
          name: poiData[poi].name,
          id: poiData[poi].id,
          location: {
            area: poiData[poi].area,
            latitude: poiData[poi].location.latitude,
            longitude: poiData[poi].location.longitude,
          },
          meta: {
            description: poiData[poi].description,
            short_description: poiData[poi].short_description,
            type: entityType.fairytale,
          },
        };
      }
    });
    return Promise.resolve(pois);
  }

  /**
  * Build Efteling restaurant object
  * This data contains general restaurant names, descriptions etc.
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Efteling();
  *
  * park.buildRestaurantPOI().then((pois) => {
  * console.log(pois)
  * });
  * @return {string} All Efteling restaurant POIS
  */
  async buildRestaurantPOI() {
    const poiData = await this.getPOIS();

    if (!poiData) throw new Error('No PoiData for Efteling found!');
    const pois = {};
    Object.keys(poiData).forEach((poi) => {
      if (poiData[poi].type === 'restaurant') {
        pois[poiData[poi].id] = {
          name: poiData[poi].name,
          id: poiData[poi].id,
          location: {
            area: poiData[poi].area,
            latitude: poiData[poi].location.latitude,
            longitude: poiData[poi].location.longitude,
          },
          meta: {
            description: poiData[poi].description,
            short_description: poiData[poi].short_description,
            type: entityType.restaurant,
          },
        };
      }
    });
    return Promise.resolve(pois);
  }

  /**
  * Build Efteling show object
  * This data contains general show names, descriptions etc.
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Efteling();
  *
  * park.buildShowPOI().then((pois) => {
  * console.log(pois)
  * });
  * @return {string} All Efteling show POIS
  */
  async buildShowPOI() {
    const poiData = await this.getPOIS();

    if (!poiData) throw new Error('No PoiData for Efteling found!');
    const pois = {};
    let wet = undefined;
    let dizzyn = undefined;
    let anxious = undefined;
    let weelchairtag = undefined;
    Object.keys(poiData).forEach((poi) => {
      if (poiData[poi].type === 'show') {
        if (poiData[poi].properties) {
          const maygetwet = poiData[poi].properties.find((prop) => prop.indexOf('wet') === 0);
          const weelchair = poiData[poi].properties.find((prop) => prop.indexOf('notaccessiblewheelchairs') === 0);
          const dizzyness = poiData[poi].properties.find((prop) => prop.indexOf('dizzy') === 0);
          const anxious1 = poiData[poi].properties.find((prop) => prop.indexOf('anxiouseffects') === 0);

          if (maygetwet !== undefined) {
            wet = 'mayGetWet';
          } else {
            wet = undefined;
          }

          if (weelchair !== undefined) {
            weelchairtag = 'NotAccessibleWithWeelchair';
          } else {
            weelchairtag = undefined;
          }

          if (dizzyness !== undefined) {
            dizzyn = 'mayGetDizzy';
          } else {
            dizzyn = undefined;
          }

          if (anxious1 !== undefined) {
            anxious = 'AnxiousEffects';
          } else {
            anxious = undefined;
          }
        }

        pois[poiData[poi].id] = {
          name: poiData[poi].name,
          id: poiData[poi].id,
          location: {
            area: poiData[poi].area,
            latitude: poiData[poi].location.latitude,
            longitude: poiData[poi].location.longitude,
          },
          meta: {
            description: poiData[poi].description,
            short_description: poiData[poi].short_description,
            type: entityType.show,
            tags: [
              wet,
              weelchairtag,
              dizzyn,
              anxious,
            ],
          },
        };
      }
    });
    return Promise.resolve(pois);
  }

  /**
  * Build Efteling merchandise object
  * This data contains general merchandise names, descriptions etc.
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Efteling();
  *
  * park.buildMercnahdisePOI().then((pois) => {
  * console.log(pois)
  * });
  * @return {string} All Efteling merchandise POIS
  */
  async buildMerchandisePOI() {
    const poiData = await this.getPOIS();

    if (!poiData) throw new Error('No PoiData for Efteling found!');
    const pois = {};
    Object.keys(poiData).forEach((poi) => {
      if (poiData[poi].type === 'merchandise') {
        pois[poiData[poi].id] = {
          name: poiData[poi].name,
          id: poiData[poi].id,
          location: {
            area: poiData[poi].area,
            latitude: poiData[poi].location.latitude,
            longitude: poiData[poi].location.longitude,
          },
          meta: {
            description: poiData[poi].description,
            short_description: poiData[poi].short_description,
            type: entityType.merchandise,
          },
        };
      }
    });
    return Promise.resolve(pois);
  }

  /**
  * Get Efteling QueueTimes data
  * This data contains the queue data, we'll assign them to the earlier fetched pois
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Efteling();
  *
  * park.getQueue().then((queue) => {
  * console.log(queue)
  * });
  * @return {string} All Efteling POIS with queuetimes
  */
  async getQueue() {
    return await this.buildRidePOI().then((rideData) => fetch(this.config.waitTimesURL,
        {
          method: 'GET',
        },
    )
        .then((res) => res.json())
        .then((json) => {
          const rides = [];
          // Park is closed, and nothing is returned, attach that here.
          if (!json.AttractionInfo.length) {
            Object.keys(rideData).forEach((ride) => {
            // Update the variables to the closed rides
              rideData[ride].waitTime = '0';
              rideData[ride].state = queueType.closed;
              rideData[ride].active = 'false';

              // Create the ride Object
              const rideobj = {
                name: rideData[ride].name,
                id: 'Efteling_' + rideData[ride].id,
                waitTime: rideData[ride].waitTime,
                state: rideData[ride].state,
                active: rideData[ride].active,
                location: {
                  area: rideData[ride].location.area,
                  latitude: rideData[ride].location.latitude,
                  longitude: rideData[ride].location.longitude,
                },
                meta: {
                  category: rideData[ride].meta.category,
                  label: rideData[ride].meta.label,
                  description: rideData[ride].meta.description,
                  short_description: rideData[ride].meta.short_description,
                  type: rideData[ride].meta.type,
                  single_rider: rideData[ride].meta.single_rider,
                  fastPass: rideData[ride].meta.fastPass,
                  tags: rideData[ride].meta.tags,
                  restrictions: rideData[ride].meta.restrictions,
                },
              };
              rides.push(rideobj);
            });

            return Promise.resolve(rides);
          }

          // If there are rides listed, fetch them here.
          json.AttractionInfo.forEach((ridetime) => {
            let state = null;
            let active = null;
            let waitTime = null;

            if (ridetime.State === 'gesloten') { // Ride closed
              state = queueType.closed;
              active = 'false';
              waitTime = '0';
            } else if (ridetime.State === 'tijdelijkbuitenbedrijf') { // Ride went down for some reason
              state = queueType.down;
              active = 'false';
              waitTime = '0';
            } else if (ridetime.State === 'inonderhoud') { // Ride in maintenance
              state = queueType.refurbishment;
              active = 'false';
              waitTime = '0';
            } else if (ridetime.WaitingTime === undefined && ridetime.State === 'open') { // Ride is open, no queuetime reported
              state = queueType.operating;
              active = 'false';
              waitTime = '0';
            } else if (ridetime.WaitingTime === undefined && ridetime.State !== 'open') { // Ride is closed
              state = queueType.closed;
              active = 'false';
              waitTime = '0';
            } else { // Probably open, or some strange newly created frankensteined queue type
              state = queueType.operating;
              active = 'true';
              waitTime = ride.WaitingTime;
            }

            if (rideData[ridetime.Id]) {
              // Update the variables to the rides
              rideData[ridetime.Id].waitTime = waitTime;
              rideData[ridetime.Id].state = state;
              rideData[ridetime.Id].active = active;

              // Create the ride Object
              const rideobj = {
                name: rideData[ridetime.Id].name,
                id: 'Efteling_' + rideData[ridetime.Id].id,
                waitTime: rideData[ridetime.Id].waitTime,
                state: rideData[ridetime.Id].state,
                active: rideData[ridetime.Id].active,
                location: {
                  area: rideData[ridetime.Id].location.area,
                  latitude: rideData[ridetime.Id].location.latitude,
                  longitude: rideData[ridetime.Id].location.longitude,
                },
                meta: {
                  category: rideData[ridetime.Id].meta.category,
                  label: rideData[ridetime.Id].meta.label,
                  description: rideData[ridetime.Id].meta.description,
                  short_description: rideData[ridetime.Id].meta.short_description,
                  type: rideData[ridetime.Id].meta.type,
                  single_rider: rideData[ridetime.Id].meta.single_rider,
                  singleRider: rideData[ridetime.Id].meta.singleRider,
                  fastPass: rideData[ridetime.Id].meta.fastPass,
                  tags: rideData[ridetime.Id].meta.tags,
                  restrictions: rideData[ridetime.Id].meta.restrictions,
                },
              };
              rides.push(rideobj);
              return Promise.resolve(rides);
            }
          });
        }),
    );
  };

  /**
  * Get Efteling Park Hours data
  * This data contains the hours data, used to display the operating hours of Efteling
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Efteling();
  *
  * park.getOpHours().then((hours) => {
  * console.log(hours)
  * });
  * @return {string} All Efteling Operating Hours for 1mo
  */
  async getOpHours() {
    const currentYear = moment().format('YYYY');
    const currentMonth = moment().format('MM');

    return fetch(
        this.config.histURL +
        `${currentYear}/${currentMonth}`,
        {
          method: 'GET',
        },
    )
        .then((res) => res.json())
        .then((json) => {
          const Calendar = [];
          if (!json.OpeningHours.length) {
          // Park is closed, do nothing but returning today as empty string
            const hours = {
              date: moment().format('YYYY-MM-DD'),
              type: 'Closed',
              openingTime: moment('23:59', 'HH:mm a').format(),
              closingTime: moment('23:59', 'HH:mm a').format(),
              special: [],
            };
            Calendar.push(hours);
          } else {
          // Return the actual opening hours
            json.OpeningHours.forEach((cal) => {
              let date = moment.tz(`${cal.Date}`, 'YYYY-MM-DD', 'Europe/Amsterdam');
              date = moment(date).format('YYYY-MM-DD');
              cal.OpeningHours.forEach((cal1) => {
                let open = moment.tz(`${date}${cal1.Open}`, 'YYYY-MM-DDHH:mm', 'Europe/Amsterdam');
                open = moment(open).format();
                let close = moment.tz(`${date}${cal1.Close}`, 'YYYY-MM-DDHH:mm', 'Europe/Amsterdam');
                close = moment(close).format();
                const type = 'Operating';

                const hours = {
                  closingTime: close,
                  openingTime: open,
                  type: type,
                  special: [],
                  date: date,
                };
                Calendar.push(hours);
              });
            });
          };
          return Promise.resolve(Calendar);
        });
  }
};

export default Efteling;
