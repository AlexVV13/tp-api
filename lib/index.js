/**
* Import all the parks included in the library
*/
// Efteling
import Efteling from './parks/efteling/efteling.js';
// Compagnie des Alpes
import WalibiHolland from './parks/walibi/walibiholland.js';
// EuropaPark
import EuropaPark from './parks/europapark/europapark.js';

/**
* Export all parks as string
*/
export default {
  parks: {
    // Efteling
    Efteling,
    // Compagnie des Alpes
    WalibiHolland,
    // EuropaPark
    EuropaPark,
  },
  allParks: [
    // Efteling
    Efteling,
    // Compagnie des Alpes
    WalibiHolland,
    // Europa-Park
    EuropaPark,
  ],
};
