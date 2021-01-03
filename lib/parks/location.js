/**
 * Location class used as base for any themeparks object that has a physical location (parks, resorts, restaurants etc.)
 * @class
 */
class Location {
  /**
   * Return a random point within an area defined by lonA, latA, lonB, and latB (a square)
   * @param {*} lonA
   * @param {*} latA
   * @param {*} lonB
   * @param {*} latB
   * @return {Object} object with longitude and latitude randomly set between locationA and locationB
   */
  static randomBetween(lonA, latA, lonB, latB) {
    return {
      longitude: lonA + (Math.random() * (lonB - lonA)),
      latitude: latA + (Math.random() * (latB - latA)),
    };
  }
}

export default Location;
