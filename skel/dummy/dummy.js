/**
* When creating a new park, this is basically the base file for it
* All is emptied, you just have to fill in the correct code & data for it to work :)
*/
// const moment = require('moment-timezone'); Some parks use timedata in their api's, sometimes you'll need moment-tz
const fetch = require('node-fetch');
const fs = require('fs');

require('dotenv').config();

// Configure the variables
const apiBase = process.env.DUMMYPARK_APIBASE;
const apiKey = process.env.DUMMYPARK_APIKEY;

// Dummy park options
const options = {
  name: 'Dummy',
  timezone: 'Europe/Amsterdam',
  latitude: 51.64990915659694,
  longitude: 5.043561458587647,
};

// Load the Dummy poidata
// const poidata = ('./data/parks/dummy/dummy_pois.json')
// const poimock = ('./data/parks/dummy/dummy_poi_mock.json')

/**
* Get Dummy data
* This data contains park data such as latlon
*/
async function getPark() {
  return Promise.resolve(
      options,
  ).then(function(value) {
    console.log(value);
  });
};

/**
* Get All POIS of Dummy
* This data contains all the POIS in Dummy
*/
async function getPOIS() {
  return fetch(apiUrl,
      {
        method: 'GET',
        headers: {
          Authorization: apiKey,
        },
      },
  )
      .then((res) => res.json())
      .then((rideData) => {
        const poi = [];
        rideData.forEach((ride) => {
          // Do stuff with the ridedata
          // POI Object with queues
          const poiData = {
            name: ride.name,
            id: ride.shortId,
            state: ride.state,
            active: ride.active,
            waitTime: ride.waitTime,
            meta: {
              type: 'attraction',
            },
          };
          poi.push(poiData);
        });
        fs.writeFile('./data/parks/dummy/dummy_pois.json', JSON.stringify(poi, null, 4), function(err) {
          if (err) return console.log(err);
        });
        fs.writeFile('./data/parks/dummy/dummy_poi_mock.json', JSON.stringify(rideData, null, 4), function(err) {
          if (err) return console.log(err);
        });
        return Promise.resolve(poi); // Although we saved them in a json file, we'll just return them for the queue attach function which will run next if you called getQueue()
      });
}

/**
* Get All Operating Hours of Dummy
* This data contains all the Operating Hours in Dummy
*/
async function getOpHours() {
  return fetch(
      apiBase,
      {
        method: 'GET',
      },
  )
      .then((res) => res.json())
      .then((json) => {
        const Calendar = [];
        // Execute Calendar stuff here
        return Promise.resolve(Calendar);
      });
}

/**
* Get All Data of Dummy
* This data contains all Dummy's data, which is fetched earlier
*/
async function getData() {
  return await Promise.all([getPOIS(), getOpHours()]).then((rides) => {
    console.log(JSON.stringify(rides, null, 4));
  });
}

/**
* Get All Calendar Data of Dummy
* This data contains all the calendar data of Dummy
*/
async function getCalendar() {
  return await getOpHours().then((calendar) => {
    console.log(calendar);
  });
}

/**
* Get All Queues of Dummy
* This data contains all the Queues in Dummy, limited to their fast-lane services
*/
async function getWaitTime() {
  return await getPOIS().then((rides) => {
    console.log(rides);
  });
}

module.exports.getPark = getPark;
module.exports.getPOIS = getPOIS;
module.exports.getOpHours = getOpHours;
module.exports.getData = getData;
module.exports.getCalendar = getCalendar;
module.exports.getWaitTime = getWaitTime;
