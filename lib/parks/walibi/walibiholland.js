const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs');

require('dotenv').config();

// Configure the variables
const apiBase = process.env.WALIBIHOLLAND_APIBASE;
const apiUrl = process.env.WALIBIHOLLAND_APIURL;
// Implementing language here is useless, because we're not fetching ride descriptions.

// Walibi park options
const options = {
  name: 'Walibi Holland',
  timezone: 'Europe/Amsterdam',
  latitude: 51.64990915659694,
  longitude: 5.043561458587647,
};

// Load the Walibi Holland poidata
// const poidata = ('./data/parks/walibi/walibiholland_pois.json')
// const poimock = ('./data/parks/walibi/walibiholland_poi_mock.json')

/**
* Get Walibi Holland data
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
* Get All POIS of Walibi Holland
* This data contains all the POIS in Walibi Holland, limited to their fast-lane services
*/
async function getPOIS() {
  return fetch(apiUrl,
      {
        method: 'GET',
      },
  )
      .then((res) => res.json())
      .then((rideData) => {
        const poi = [];
        rideData.forEach((ride) => {
          if (ride.name !== 'Dummy1') { // They have a dummy ride to sell single shots in their fast-lane, mind=blown
            if (ride.useVirtualQueue == 'true') { // VirtQueue enabled
              waitTime = Math.round(ride.waitTimeMins); // Stupid API serves random numbers like 0.00010358, let's round them.
            } else { // No virtQueue found, use the normal queue instead
              waitTime = ride.minWait / 60; // Walibi has some calculation issues or sth so divide our result by 60
            }
            if (ride.state === 'closed_indefinitely') { // Closed but not closed but still closed
              state = 'Closed';
              active = 'false';
            } // Declare other states when park reopens
            // POI Object with queues
            const poiData = {
              name: ride.name,
              id: ride.shortId,
              state: state,
              active: active,
              waitTime: waitTime,
              meta: {
                type: 'attraction',
              },
            };
            poi.push(poiData);
          }
        });
        fs.writeFile('./data/parks/walibi/walibiholland_pois.json', JSON.stringify(poi, null, 4), function(err) {
          if (err) return console.log(err);
        });
        fs.writeFile('./data/parks/walibi/walibiholland_poi_mock.json', JSON.stringify(rideData, null, 4), function(err) {
          if (err) return console.log(err);
        });
        return Promise.resolve(poi); // Although we saved them in a json file, we'll just return them for the queue attach function which will run next if you called getQueue()
      });
}

/**
* Get All Operating Hours of Walibi Holland
* This data contains all the Operating Hours in Walibi Holland, fetched with currentyear.
*/
async function getOpHours() {
  const currentYear = moment().format('YYYY');
  return fetch(
      apiBase +
        `/calendar/${currentYear}?_format=json`,
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
* Get All Data of Walibi Holland
* This data contains all Walibi's data, which is fetched earlier
*/
async function getData() {
  return await Promise.all([getPOIS(), getOpHours()]).then((rides) => {
    console.log(JSON.stringify(rides, null, 4));
  });
}

/**
* Get All Calendar Data of Walibi Holland
* This data contains all the calendar data of Walibi Holland
*/
async function getCalendar() {
  return await getOpHours().then((calendar) => {
    console.log(calendar);
  });
}

/**
* Get All Queues of Walibi Holland
* This data contains all the Queues in Walibi Holland, limited to their fast-lane services
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
