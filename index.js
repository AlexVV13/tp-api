// Import all parks here
import tpapi from '@alexvv13/tpapi';

const park = new tpapi.parks.EuropaPark();

const parks = {};
for (const park in tpapi.parks) {
  parks[park] = new tpapi.parks[park]();
}


for (const park in parks) {
  console.log(parks[park].Name)
}

// Print queues Example usage of Europa-Park
park.getWaitTimes().then((rideTimes) => {
  //rideTimes.forEach((ride) => {
  //  console.log(`${ride.name}: ${ride.queues.standBy.waitTime} minutes wait | ${ride.queues.standBy.status}`);
  //})
});

// You can also call getCalendar(), getPark()
