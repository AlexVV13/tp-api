import Entity from '../entity.js';

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

    if (this.constructor === Park) {
      throw new TypeError('Cannot create Park object directly, only park implementations of Park');
    }
  }

  /**
  * Get All Queues of a park
  * This data contains all the Queues in park
  * @return {string} WaitTimes
  */
  getWaitTime() {
    return this.getQueue().then((rides) => Promise.resolve(rides));
  };

  /**
  * Get All Calendar Data of a specific park
  * This data contains all the calendar data of a specific Park
  * @return {string} operating hours
  */
  getCalendar() {
    return this.getOpHours().then((hours) => Promise.resolve(hours));
  }

  /**
  * Get All Data of a specific park
  * This data contains all park's data, which is fetched earlier
  * @return {string} all park data
  */
  async getData() {
    const rides = await this.getQueue();
    const hours = await this.getOpHours();

    const string = JSON.stringify({rides, hours}, null, 4);

    return Promise.resolve(string);
  }
};

export default Park;
