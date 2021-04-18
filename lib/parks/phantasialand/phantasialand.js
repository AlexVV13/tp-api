import fetch from 'node-fetch';
import moment from 'moment-timezone';
import {Park} from '../park.js';
import Location from '../location.js';

import dotenv from 'dotenv';
import {entityType, queueType, scheduleType} from '../types.js';
import {entityCategory, entityTags} from '../tags.js';
dotenv.config();

/**
* Phantasialand Park Object
* Make sure all environment variables are set in an .env file which should be in the main location.
* Not setting these variables will make the module exit early without returning data.
*
* This class is here to fetch the POI data and to attach queue times data to it.
* After the fetches this data is send to the end user and from there he could do whatever he wants to do.
*
* Most park specific parameters are set already
* @class
*/
export class Phantasialand extends Park {
  /**
  * Create a new Phantasialand Park object
  * @param {object} options
  */
  constructor(options = {}) {
    options.name = 'Phantasialand';
    options.timezone = 'Europe/Berlin';

    // Setting the parks entrance as it's default location
    options.latitude = 50.798954;
    options.longitude = 6.879314;

    // Options for our park Object
    options.supportswaittimes = true;
    options.supportsschedule = false;
    options.supportsrideschedules = true;
    options.fastPass = false;
    options.FastPassReturnTimes = false;

    // Options for location faking
    options.longitudeMin = 6.878342628;
    options.longitudeMax = 6.877570152;
    options.latitudeMin = 50.800659529;
    options.latitudeMax = 50.799683077;

    // Api options
    options.apiKey = process.env.PHANTASIALAND_API_KEY;

    options.poiUrl = process.env.PHANTASIALAND_POI_URL;
    options.waitTimesURL = process.env.PHANTASIALAND_WAITTIMES_URL;
    options.hoursURL = process.env.PHANTASIALAND_HOURS_URL;

    // Language options
    options.languages = process.env.LANGUAGES;

    options.langoptions = `{'en', 'fr', 'de', 'nl'}`;

    super(options);

    // Check for existance
    if (!this.config.poiUrl) throw new Error('Missing Phantasialand poi url!');
    if (!this.config.apiKey) throw new Error('Missing Phantasialand apiKey!');
    if (!this.config.waitTimesURL) throw new Error('Missing Phantasialand waittimes url!');
    if (!this.config.hoursURL) throw new Error('Missing Phantasialand Operating Hours url!');
    if (!this.config.languages) {
      this.config.languages = 'en';
    };

    this.config.langpref = [`${this.config.languages}`, 'de'];
  }

  /**
  * Get Phantasialand POI data
  * This data contains general ride names, descriptions etc.
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.Phantasialand();
  *
  * park.getPois().then((pois) => {
  * console.log(pois)
  * });
  * @return {string} All P POIS without queuetimes
  */
  async getPOIS() {
    // So phantasialand is kinda strange with this, but it provides ALL languages at once, set your env var as no one lang.
    const pickName = (title) => {
      const n = this.config.langpref.find((lang) => title[lang]);
      return n !== undefined ? title[n] : title;
    };
    return fetch(`${this.config.poiUrl}`,
        {
          method: 'GET',
        },
    )
        .then((res) => res.json())
        .then((rideData) => {
          const rides = {};
          rideData.forEach((ride) => {
            const category = [];
            const tags = [];
            if (ride.tags) {
              ride.tags.forEach((tag) => {
                // Category
                if (tag === 'ATTRACTION_TYPE_CHILDREN') {
                  category.push(entityCategory.youngest);
                }
                if (tag === 'ATTRACTION_TYPE_FAMILY') {
                  category.push(entityCategory.family);
                }
                if (tag === 'ATTRACTION_TYPE_ACTION') {
                  category.push(entityCategory.thrill);
                }

                // Tags
                if (tag === 'ATTRACTION_TYPE_ROOFED') {
                  tags.push(entityTags.indoor);
                }
                if (tag === 'ATTRACTION_TYPE_PICTURES') {
                  tags.push(entityTags.onridePhoto);
                }
                if (tag === 'ATTRACTION_TYPE_CHILDREN_MAY_SCARE') {
                  tags.push(entityTags.scary);
                }
              });
            }
            let minAge = undefined;
            let maxAge = undefined;
            let minHeight = undefined;
            let maxHeight = undefined;
            let minHeightAccompanied = undefined;

            if (ride.minAge) {
              minAge = ride.minAge;
            }
            if (ride.maxAge) {
              maxAge = ride.maxAge;
            }
            if (ride.minSize) {
              minHeight = ride.minSize;
            }
            if (ride.maxSize) {
              maxHeight = ride.maxSize;
            }
            if (ride.minSizeEscort) {
              minHeightAccompanied = ride.minSizeEscort;
            }
            const restrictions = {
              minAge,
              minHeight,
              minHeightAccompanied,
              maxHeight,
              maxAge,
            };
            const location = (ride.entrance && ride.entrance.world) ? ride.entrance.world : undefined;
            rides[ride.id] = {
              name: pickName(ride.title),
              id: ride.id,
              location: {
                area: ride.area,
                longitude: location ? location.lng : null,
                latitude: location ? location.lat : null,
              },
              meta: {
                category,
                type: ride.category,
                descriptions: {
                  description: pickName(ride.description),
                  short_description: pickName(ride.tagline),
                },
                tags,
                restrictions,
              },
            };
          });
          return Promise.resolve(rides);
        });
  }

  /**
   * Fetch service data
   */
  async buildServicePOI() {
    return await this.cache.wrap(`servicedata`, async () => {
      const rideData = await this.getPOIS();
      const rides = {};
      Object.keys(rideData).forEach((ride) => {
        // We only want services
        if (rideData[ride].meta.type !== 'SERVICE') return undefined;

        const id = rideData[ride].id;

        rides[id] = {
          name: rideData[ride].name,
          id: `Phantasialand_${id}`,
          location: {
            area: rideData[ride].location.area,
            longitude: rideData[ride].location.longitude,
            latitude: rideData[ride].location.latitude,
          },
          meta: {
            category: rideData[ride].meta.category,
            type: entityType.ride,
            descriptions: {
              description: rideData[ride].meta.descriptions.description,
              short_description: rideData[ride].meta.descriptions.short_description,
            },
            tags: rideData[ride].meta.tags,
          },
        };
      });
      return Promise.resolve(rides);
    }, 1000 * 60 * 60 * this.config.cachepoistime /* cache for 12 hours */);
  }

  /**
   * Fetch shop data
   */
  async buildMerchandisePOI() {
    return await this.cache.wrap(`shopdata`, async () => {
      const rideData = await this.getPOIS();
      const rides = {};
      Object.keys(rideData).forEach((ride) => {
        // We only want shops
        if (rideData[ride].meta.type !== 'SHOPS') return undefined;

        const id = rideData[ride].id;

        rides[id] = {
          name: rideData[ride].name,
          id: `Phantasialand_${id}`,
          location: {
            area: rideData[ride].location.area,
            longitude: rideData[ride].location.longitude,
            latitude: rideData[ride].location.latitude,
          },
          meta: {
            category: rideData[ride].meta.category,
            type: entityType.ride,
            descriptions: {
              description: rideData[ride].meta.descriptions.description,
              short_description: rideData[ride].meta.descriptions.short_description,
            },
            tags: rideData[ride].meta.tags,
          },
        };
      });
      return Promise.resolve(rides);
    }, 1000 * 60 * 60 * this.config.cachepoistime /* cache for 12 hours */);
  }

  /**
   * Fetch event data
   */
  async buildEventPOI() {
    return await this.cache.wrap(`eventdata`, async () => {
      const rideData = await this.getPOIS();
      const rides = {};
      Object.keys(rideData).forEach((ride) => {
        // We only want event locations
        if (rideData[ride].meta.type !== 'EVENT_LOCATIONS') return undefined;

        const id = rideData[ride].id;

        rides[id] = {
          name: rideData[ride].name,
          id: `Phantasialand_${id}`,
          location: {
            area: rideData[ride].location.area,
            longitude: rideData[ride].location.longitude,
            latitude: rideData[ride].location.latitude,
          },
          meta: {
            category: rideData[ride].meta.category,
            type: entityType.ride,
            descriptions: {
              description: rideData[ride].meta.descriptions.description,
              short_description: rideData[ride].meta.descriptions.short_description,
            },
            tags: rideData[ride].meta.tags,
          },
        };
      });
      return Promise.resolve(rides);
    }, 1000 * 60 * 60 * this.config.cachepoistime /* cache for 12 hours */);
  }

  /**
   * Fetch hotel data
   */
  async buildHotelPOI() {
    return await this.cache.wrap(`hoteldata`, async () => {
      const rideData = await this.getPOIS();
      const rides = {};
      Object.keys(rideData).forEach((ride) => {
        // We only want hotels
        if (rideData[ride].meta.type !== 'PHANTASIALAND_HOTELS') return undefined;

        const id = rideData[ride].id;

        rides[id] = {
          name: rideData[ride].name,
          id: `Phantasialand_${id}`,
          location: {
            area: rideData[ride].location.area,
            longitude: rideData[ride].location.longitude,
            latitude: rideData[ride].location.latitude,
          },
          meta: {
            category: rideData[ride].meta.category,
            type: entityType.ride,
            descriptions: {
              description: rideData[ride].meta.descriptions.description,
              short_description: rideData[ride].meta.descriptions.short_description,
            },
            tags: rideData[ride].meta.tags,
          },
        };
      });
      return Promise.resolve(rides);
    }, 1000 * 60 * 60 * this.config.cachepoistime /* cache for 12 hours */);
  }

  /**
   * Fetch hotel bar data
   */
  async buildHotelBarPOI() {
    return await this.cache.wrap(`hotelbardata`, async () => {
      const rideData = await this.getPOIS();
      const rides = {};
      Object.keys(rideData).forEach((ride) => {
        // We only want hotel bars
        if (rideData[ride].meta.type !== 'PHANTASIALAND_HOTELS_BARS') return undefined;

        const id = rideData[ride].id;

        rides[id] = {
          name: rideData[ride].name,
          id: `Phantasialand_${id}`,
          location: {
            area: rideData[ride].location.area,
            longitude: rideData[ride].location.longitude,
            latitude: rideData[ride].location.latitude,
          },
          meta: {
            category: rideData[ride].meta.category,
            type: entityType.ride,
            descriptions: {
              description: rideData[ride].meta.descriptions.description,
              short_description: rideData[ride].meta.descriptions.short_description,
            },
            tags: rideData[ride].meta.tags,
          },
        };
      });
      return Promise.resolve(rides);
    }, 1000 * 60 * 60 * this.config.cachepoistime /* cache for 12 hours */);
  }

  /**
   * Fetch restaurant data
   */
  async buildRestaurantPOI() {
    return await this.cache.wrap(`restdata`, async () => {
      const rideData = await this.getPOIS();
      const rides = {};
      Object.keys(rideData).forEach((ride) => {
        // We only want restaurants
        if (rideData[ride].meta.type !== 'RESTAURANTS_AND_SNACKS') return undefined;

        const id = rideData[ride].id;

        rides[id] = {
          name: rideData[ride].name,
          id: `Phantasialand_${id}`,
          location: {
            area: rideData[ride].location.area,
            longitude: rideData[ride].location.longitude,
            latitude: rideData[ride].location.latitude,
          },
          meta: {
            category: rideData[ride].meta.category,
            type: entityType.ride,
            descriptions: {
              description: rideData[ride].meta.descriptions.description,
              short_description: rideData[ride].meta.descriptions.short_description,
            },
            tags: rideData[ride].meta.tags,
          },
        };
      });
      return Promise.resolve(rides);
    }, 1000 * 60 * 60 * this.config.cachepoistime /* cache for 12 hours */);
  }

  /**
   * Fetch ride data
   */
  async buildRidePOI() {
    return await this.cache.wrap(`ridedata`, async () => {
      const rideData = await this.getPOIS();
      const rides = {};
      Object.keys(rideData).forEach((ride) => {
        // We only want rides
        if (rideData[ride].meta.type !== 'ATTRACTIONS') return undefined;

        const id = rideData[ride].id;

        rides[id] = {
          name: rideData[ride].name,
          id: `Phantasialand_${id}`,
          location: {
            area: rideData[ride].location.area,
            longitude: rideData[ride].location.longitude,
            latitude: rideData[ride].location.latitude,
          },
          meta: {
            category: rideData[ride].meta.category,
            type: entityType.ride,
            descriptions: {
              description: rideData[ride].meta.descriptions.description,
              short_description: rideData[ride].meta.descriptions.short_description,
            },
            tags: rideData[ride].meta.tags,
            restrictions: rideData[ride].meta.restrictions,
          },
        };
      });
      return Promise.resolve(rides);
    }, 1000 * 60 * 60 * this.config.cachepoistime /* cache for 12 hours */);
  }

  /**
   * Fetch wait times
   */
  async getWaitTime() {
    return this.buildRidePOI().then((poi) => {
      // We'll pretend we're actually in Phantasialand, cause we're cool
      const RandomLocation = Location.randomBetween(this.config.longitudeMin, this.config.latitudeMin, this.config.longitudeMax, this.config.latitudeMax);

      return fetch(`${this.config.waitTimesURL}?loc=${RandomLocation.latitude},${RandomLocation.longitude}&compact=true&access_token=${this.config.apiKey}`,
          {
            method: 'GET',
          },
      )
          .then((res) => res.json())
          .then((ride) => {
            const rides = [];
            // console.log(ride);
            if (!ride) throw new Error('No queuedata found!');
            Object.keys(ride).forEach((rideData) => {
              console.log(ride[rideData].waitTime);
              let waitTime = '0';
              let active = false;
              let state = queueType.closed;

              // Check if ride is open and if it actually has a queuetime attached
              if (ride[rideData].open && ride[rideData].waitTime !== null) {
                waitTime = ride[rideData].waitTime;
                active = true;
                state = queueType.operating;
              }

              // Attach schedule if known, api communicates closingtimes at least (Shown on park signage)
              let openTime = undefined;
              let closingTime = undefined;
              let opType = undefined;

              if (ride[rideData].opening && ride[rideData].closing) { // We got ridetimes so display them
                openTime = moment(ride[rideData].opening).format();
                closingTime = moment(ride[rideData].closing).format();
                opType = scheduleType.operating;
              } else { // Park is probably closed
                openTime = undefined;
                closingTime = undefined;
                opType = scheduleType.closed;
              }

              if (poi[ride[rideData].poiId]) {
                const rideobj = {
                  name: poi[ride[rideData].poiId].name,
                  id: poi[ride[rideData].poiId].id,
                  state: state,
                  waitTime: waitTime,
                  active: active,
                  changedAt: ride[rideData].updatedAt,
                  location: poi[ride[rideData].poiId].location,
                  meta: poi[ride[rideData].poiId].meta,
                  schedule: {
                    openingTime: openTime,
                    closingTime: closingTime,
                    type: opType,
                  },
                };
                rides.push(rideobj);
              }
            });
            return Promise.resolve(rides);
          });
    });
  }
};

export default Phantasialand;
