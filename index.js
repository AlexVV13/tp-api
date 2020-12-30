// Import all parks here
import tpapi from '@alexvv13/tpapi';

const park = new tpapi.parks.Efteling();

// Fetch POIS Example usage of Europa-Park
park.buildMerchandisePOI().then((rideTimes) => {
  console.log(rideTimes);
  // rideTimes.forEach((ride) => {
  //  console.log(`${ride.meta.minHeight}: ${ride.waitTime} minutes wait (${ride.state})`);
  // });
});

// You can also call getCalendar() or getData()
