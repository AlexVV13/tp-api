// Import all parks here
import tpapi from './lib/parks/index.js';

const park = new tpapi.parks.WalibiHolland();

// Fetch POIS
park.getData(); // Get All data for efteling, you could also run getCalendar() or getWaitTime()

