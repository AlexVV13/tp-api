// Import all parks here
import tpapi from '@alexvv13/tpapi';

const park = new tpapi.parks.WalibiBelgium();

// Print queues Example usage of Europa-Park
park.getOpHours().then((rideTimes) => {
  /* rideTimes.forEach((ride) => {
    console.log(`${ride.name}: ${ride.waitTime} minutes. - **${ride.state}**`);
  }); */
  console.log(rideTimes);
});

// You can also call getCalendar(), getPark() or getData()
