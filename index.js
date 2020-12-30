// Import all parks here
import tpapi from '@alexvv13/tpapi';

const park = new tpapi.parks.EuropaPark();

// Fetch POIS Example usage of Europa-Park
park.getWaitTimes().then((rideTimes) => {
  console.log(rideTimes);
});

// You can also call getCalendar(), getPark() or getData()
