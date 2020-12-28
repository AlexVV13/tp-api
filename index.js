// Import all parks here
import tpapi from '@alexvv13/tpapi';

const park = new tpapi.parks.Efteling();

// Fetch POIS Example usage of Europa-Park
park.getData().then((rideTimes) => {
  console.log(rideTimes);
});

// You can also call getCalendar() or getData()
