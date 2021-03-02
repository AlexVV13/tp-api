// Import all parks here
import tpapi from '@alexvv13/tpapi';

const park = new tpapi.parks.WalibiHolland();

// Print queues Example usage of Europa-Park
park.getWaitTime().then((rideTimes) => {
  console.log(rideTimes);
});

// You can also call getCalendar(), getPark() or getData()
