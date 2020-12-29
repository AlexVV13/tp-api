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

    // create a new cache object for this park
    this.cache = new Cache(this.constructor.name, this.config.cacheVersion || 0);

    if (this.constructor === Park) {
      throw new TypeError('Cannot create Park object directly, only park implementations of Park');
    }
  }

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
};

export default Park;
