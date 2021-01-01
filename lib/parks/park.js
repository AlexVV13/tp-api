import Entity from './entity.js';
import Cache from '../cache/scopedCache.js';

/**
 * Base Park Object
 * @class
 */
export class Park extends Entity {
  /**
   * Create a new Park object
   * @param {Object} options
   */
  constructor(options = {}) {
    super(options);

    /**
     * Create a new cache object for this park, so we can reuse pois instead of refetch them every time.
     */
    this.cache = new Cache(this.constructor.name, this.config.cacheVersion || 0);

    if (this.constructor === Park) {
      throw new TypeError('Cannot create Park object directly, only park implementations of Park');
    }
  }

  /**
  * Get All Data of a park
  * This data contains all the Data in park
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.PARKNAME();
  *
  * park.getPark().then((park) => {
  * console.log(park)
  * });
  * @return {string} All PARK data
  */
  getPark() {
    return Promise.resolve({
      Name: this.Name,
      Timezone: this.Timezone,
      Location: this.LocationString,
      Supported_Languages: this.LangOptions,
      Supports_Waittimes: this.SupportsWaitTimes,
      Supports_RideSchedules: this.SupportsRideSchedules,
      Supports_Opening_Times: this.SupportsOpeningTimes,
      Supports_FastPass: this.FastPass,
      Supports_FastPass_ReturnTimes: this.FastPassReturnTimes,
      CurrentTime: this.Now,
    });
  };

  /**
  * Get All Queues of a park
  * This data contains all the Queues in park
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.PARKNAME();
  *
  * park.getWaitTime().then((ridetimes) => {
  * console.log(ridetimes)
  * });
  * @return {string} All PARK queuetimes
  */
  getWaitTime() {
    return this.getQueue().then((rides) => Promise.resolve(rides));
  };

  /**
  * Get All Calendar Data of a specific park
  * This data contains all the calendar data of a specific Park
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.PARKNAME();
  *
  * park.getCalendar().then((hours) => {
  * console.log(hours)
  * });
  * @return {string} All PARK calendar data
  */
  getCalendar() {
    return this.getOpHours().then((hours) => Promise.resolve(hours));
  }

  /**
  * Get All Data of a specific park
  * This data contains all park's data, which is fetched earlier
  * @example
  * import tpapi from '@alexvv13/tpapi';
  *
  * const park = new tpapi.park.PARKNAME();
  *
  * park.getData().then((data) => {
  * console.log(data)
  * });
  * @return {string} All PARK data(hours, queuetimes)
  */
  async getData() {
    const rides = await this.getQueue();
    const hours = await this.getOpHours();

    const string = {rides, hours};

    return Promise.resolve(string);
  }

  /**
  * Get All Rides of a park
  * This data contains all the rides.
  * @return {string} park rides
  */
  async getRides() {
    const rideData = await this.buildRidePOI();

    if (!rideData) throw new Error('Something went wrong, didnt return any ride data?');

    const rides = [];
    Object.keys(rideData).forEach((ride) => {
      const rideobj = {
        name: rideData[ride].name,
        id: rideData[ride].id,
        location: {
          area: rideData[ride].location.area,
          latitude: rideData[ride].location.latitude,
          longitude: rideData[ride].location.longitude,
        },
        fastPass: {
          isVirtQueue: rideData[ride].meta.isVirtQueue,
          fastPass: rideData[ride].meta.fastPass,
          parent: rideData[ride].meta.parent,
        },
        meta: {
          descriptions: {
            description: rideData[ride].meta.description,
            short_description: rideData[ride].meta.short_description,
          },
          type: rideData[ride].meta.type,
          single_rider: rideData[ride].meta.single_rider,
          tags: rideData[ride].meta.tags,
          restrictions: rideData[ride].meta.restrictions,
        },
      };
      rides.push(rideobj);
    });
    return rides;
  }

  /**
  * Get All Statics of a park
  * This data contains all the static.
  * @return {string} park static pois
  */
  async getStatic() {
    const rideData = await this.buildStaticPOI();

    if (!rideData) throw new Error('Something went wrong, didnt return any static data?');

    const rides = [];
    Object.keys(rideData).forEach((ride) => {
      const rideobj = {
        name: rideData[ride].name,
        id: rideData[ride].id,
        location: {
          area: rideData[ride].location.area,
          latitude: rideData[ride].location.latitude,
          longitude: rideData[ride].location.longitude,
        },
        meta: {
          descriptions: {
            description: rideData[ride].meta.description,
            short_description: rideData[ride].meta.short_description,
          },
          type: rideData[ride].meta.type,
          tags: rideData[ride].meta.tags,
          restrictions: rideData[ride].meta.restrictions,
        },
      };
      rides.push(rideobj);
    });
    return rides;
  }

  /**
  * Get All Restaurants of a park
  * This data contains all the restaurants.
  * @return {string} park restaurants
  */
  async getRestaurant() {
    const rideData = await this.buildRestaurantPOI();

    if (!rideData) throw new Error('Something went wrong, didnt return any restaurant data?');

    const rides = [];
    Object.keys(rideData).forEach((ride) => {
      const rideobj = {
        name: rideData[ride].name,
        id: rideData[ride].id,
        location: {
          area: rideData[ride].location.area,
          latitude: rideData[ride].location.latitude,
          longitude: rideData[ride].location.longitude,
        },
        meta: {
          descriptions: {
            description: rideData[ride].meta.description,
            short_description: rideData[ride].meta.short_description,
          },
          type: rideData[ride].meta.type,
          tags: rideData[ride].meta.tags,
          restrictions: rideData[ride].meta.restrictions,
        },
      };
      rides.push(rideobj);
    });
    return rides;
  }

  /**
  * Get All Merchandise of a themepark
  * This data contains all the merchandise.
  * @return {string} park mcerchandise pois
  */
  async getMerchandise() {
    const rideData = await this.buildMerchandisePOI();

    if (!rideData) throw new Error('Something went wrong, didnt return any merchandise data?');

    const rides = [];
    Object.keys(rideData).forEach((ride) => {
      const rideobj = {
        name: rideData[ride].name,
        id: rideData[ride].id,
        location: {
          area: rideData[ride].location.area,
          latitude: rideData[ride].location.latitude,
          longitude: rideData[ride].location.longitude,
        },
        meta: {
          descriptions: {
            description: rideData[ride].meta.description,
            short_description: rideData[ride].meta.short_description,
          },
          type: rideData[ride].meta.type,
          tags: rideData[ride].meta.tags,
          restrictions: rideData[ride].meta.restrictions,
        },
      };
      rides.push(rideobj);
    });
    return rides;
  }

  /**
  * Get All Services of park
  * This data contains all the EP park.
  * @return {string} park services pois
  */
  async getService() {
    const rideData = await this.buildServicePOI();

    if (!rideData) throw new Error('Something went wrong, didnt return any service data?');

    const rides = [];
    Object.keys(rideData).forEach((ride) => {
      const rideobj = {
        name: rideData[ride].name,
        id: rideData[ride].id,
        location: {
          area: rideData[ride].location.area,
          latitude: rideData[ride].location.latitude,
          longitude: rideData[ride].location.longitude,
        },
        meta: {
          descriptions: {
            description: rideData[ride].meta.description,
            short_description: rideData[ride].meta.short_description,
          },
          type: rideData[ride].meta.type,
          tags: rideData[ride].meta.tags,
          restrictions: rideData[ride].meta.restrictions,
        },
      };
      rides.push(rideobj);
    });
    return rides;
  }

  /**
  * Get All Fairytales of park
  * This data contains all the fairytales.
  * @return {string} park fairytale pois
  */
  async getFairytale() {
    const rideData = await this.buildFairytalePOI();

    if (!rideData) throw new Error('Something went wrong, didnt return any static data?');

    const rides = [];
    Object.keys(rideData).forEach((ride) => {
      const rideobj = {
        name: rideData[ride].name,
        id: rideData[ride].id,
        location: {
          area: rideData[ride].location.area,
          latitude: rideData[ride].location.latitude,
          longitude: rideData[ride].location.longitude,
        },
        meta: {
          descriptions: {
            description: rideData[ride].meta.description,
            short_description: rideData[ride].meta.short_description,
          },
          type: rideData[ride].meta.type,
          tags: rideData[ride].meta.tags,
          restrictions: rideData[ride].meta.restrictions,
        },
      };
      rides.push(rideobj);
    });
    return rides;
  }
};

export default Park;
