// Import all parks here
import tpapi from '@alexvv13/tpapi';

const park = new tpapi.parks.EuropaPark();

// Print queues Example usage of Europa-Park
park.getWaitTimes().then((rideTimes) => {
  rideTimes.forEach((ride) => {
    console.log(`${ride.name}: ${ride.queues.standBy.waitTime} minutes wait | ${ride.queues.standBy.status}`);
  })
});

// You can also call getCalendar(), getPark()