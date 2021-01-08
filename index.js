// Import all parks here
import tpapi from '@alexvv13/tpapi';

const park = new tpapi.parks.EuropaPark();

// Print queues Example usage of Europa-Park
park.getWaitTime().then((rideTimes) => {
  rideTimes.forEach((ride) => {
    console.log(`${ride.name}: ${ride.waitTime} minutes. - **${ride.state}**`);
  });
});

// You can also call getCalendar(), getPark() or getData()
