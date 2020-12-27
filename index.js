// Import all parks here
import tpapi from './lib/parks/index.js';

const park = new tpapi.parks.Efteling();

// Fetch POIS
park.getWaitTime(); // Fetch the queues for, in this example, EuropaPark

