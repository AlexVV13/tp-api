// Import all parks here
const tpapi = require('./lib/parks/index');

// Fetch POIS
tpapi.Parks.WalibiHolland.getData(); // Get All data for efteling, you could also run getCalendar() or getWaitTime()

