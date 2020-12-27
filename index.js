// Import all parks here
import tpapi from './lib/parks/index.js';

const park = new tpapi.parks.Efteling();

// Fetch POIS
park.getWaitTime(); // Get All data for efteling, you could also run getCalendar() or getWaitTime()

