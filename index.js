// Import all parks here
import tpapi from '@alexvv13/tpapi';
import fs from 'file-system';

const park = new tpapi.parks.Efteling();

// Print queues Example usage of Europa-Park
park.getWaitTimes().then((rideTimes) => {
  fs.writeFile('./rides.json', JSON.stringify(rideTimes));
  //rideTimes.forEach((ride) => {
  //  console.log(`${ride.name}: ${ride.queues.standBy.waitTime} minutes wait | ${ride.queues.standBy.status}`);
  //})
});

// You can also call getCalendar(), getPark()
