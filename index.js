// Import all parks here
import tpapi from './lib/index.js';

const park = new tpapi.parks.EuropaPark();

// Fetch POIS Example usage of Europa-Park
park.getWaitTime().then((rideTimes) => {
  console.log(rideTimes);
});

// You can also call getCalendar() or getData()
