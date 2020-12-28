import ConfigBase from './configBase.js';
import moment from 'moment-timezone';

/**
 * A super-class that Parks/Resorts/etc. inherit from.
 * Handles general logic for objects that are a place/entity.
 */
export class Entity extends ConfigBase {
  /**
   * Construct a new Entity
   * @param {object} options
   */
  constructor(options = {}) {
    // offline mode, never request any data, rely on manually serialised data to run
    options.offline = options.offline || false;

    // generate a random Android user-agent if we aren't supplied one
    options.useragent = options.useragent || null;

    super(options);

    if (!this.config.name) {
      throw new Error(`Missing name for constructed Entity object ${this.constructor.name}`);
    }

    if (!this.config.timezone) {
      throw new Error(`Missing timezone for constructed Entity object ${this.constructor.name}`);
    }
    if (moment.tz.names().indexOf(this.config.timezone) < 0) {
      throw new Error(`Entity object ${this.constructor.name} gives an invalid timezone: ${this.config.timezone}`);
    }
  }

  /**
   * Debug log
   * @param  {...any} args Message to debug log
   */
  log(...args) {
    console.log(`[\x1b[32m${this.getUniqueID()}\x1b[0m]`, ...args);
  }

  /**
   * Get a globally unique ID for this entity
   * @return {string}
   */
  getUniqueID() {
    // by default, return the class name
    return this.constructor.name;
  }

  /**
   * Return the current time for this entity in its local timezone
   * @return {moment}
   */
  getTimeNowMoment() {
    return moment().tz(this.config.timezone);
  }

  /**
   * Return the current time for this entity in its local timezone
   * @return {string}
   */
  getTimeNow() {
    return this.getTimeNowMoment().format();
  }

  /**
   * Get entity's human-friendly name string
   * @return {string}
   */
  get Name() {
    return this.config.name;
  }

  /**
   * Get entity's human-friendly language string
   * @return {string}
   */
  get LangOptions() {
    return this.config.langoptions;
  }

  /**
   * Get entity's human-friendly location string
   * @return {string}
   */
  get LocationString() {
    return `${this.config.latitude}, ${this.config.longitude}`;
  }

  /**
   * Get entity's human-friendly timezone string
   * @return {string}
   */
  get Timezone() {
    return this.config.timezone;
  }

  /**
   * Get entity's human-friendly waittimes support string
   * @return {string}
   */
  get SupportsWaitTimes() {
    return this.config.supportswaittimes;
  }

  /**
   * Get entity's human-friendly openingtimes support string
   * @return {string}
   */
  get SupportsOpeningTimes() {
    return this.config.supportsschedule;
  }

  /**
   * Get entity's human-friendly ride openingtimes support string
   * @return {string}
   */
  get SupportsRideSchedules() {
    return this.config.supportsrideschedules;
  }

  /**
   * Get entity's human-friendly fastpass support string
   * @return {string}
   */
  get FastPass() {
    return this.config.fastPass;
  }

  /**
   * Get entity's human-friendly FastPassReturnTimes support string
   * @return {string}
   */
  get FastPassReturnTimes() {
    return this.config.FastPassReturnTimes;
  }

  /**
   * Get entity's human-friendly moment now string
   * @return {string}
   */
  get Now() {
    return this.getTimeNow();
  }
}

export default Entity;
