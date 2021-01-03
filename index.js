// Import all parks here
import tpapi from '@alexvv13/tpapi';

const park = new tpapi.parks.Phantasialand();

// Fetch POIS Example usage of Europa-Park
park.getOpHours().then((rideTimes) => {
  console.log(rideTimes);
});

// You can also call getCalendar(), getPark() or getData()
