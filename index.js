// Import all parks here
import tpapi from './lib/parks/index.js';

const park = new tpapi.parks.Efteling();

// Fetch POIS Example usage of Efteling
park.getWaitTime().then((rideTimes) => {
  console.log(rideTimes);
});

// You can also call getCalendar() or getData()
