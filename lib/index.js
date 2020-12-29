/**
* Import all the parks included in the library
*/
// Efteling
import Efteling from './parks/efteling/efteling.js';
// EuropaPark
import EuropaPark from './parks/europapark/europapark.js';
// Compagnie des Alpes
import WalibiBelgium from './parks/walibi/walibibelgium.js';
import WalibiHolland from './parks/walibi/walibiholland.js';

/**
* Export all parks as string
*/
export default {
  parks: {
    // Efteling
    Efteling,
    // EuropaPark
    EuropaPark,
    // Compagnie des Alpes
    WalibiBelgium,
    WalibiHolland,
  },
  allParks: [
    // Efteling
    Efteling,
    // Europa-Park
    EuropaPark,
    // Compagnie des Alpes
    WalibiBelgium,
    WalibiHolland,
  ],
};
