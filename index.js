// Import all parks here
import tpapi from './lib/parks/index.js';

const park = new tpapi.parks.EuropaPark();

// Fetch POIS
park.getQueue(); // Get All data for efteling, you could also run getCalendar() or getWaitTime()

