// const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs');

require('dotenv').config();

// Configure the variables
const login = process.env.EUROPAPARK_LOGINSTRING;
const loginurl = process.env.EUROPAPARK_LOGIN;
// const refreshurl = process.env.EUROPAPARK_REFRESHURL;
const apiBase = process.env.EUROPAPARK_APIBASE;

// EuropaPark park options
const options = {
  name: 'EuropaPark',
  timezone: 'Europe/Berlin',
  latitude: 51.64990915659694,
  longitude: 5.043561458587647,
};

// Load the EuropaPark poidata
// const poidata = ('./data/parks/europapark/europapark_pois.json');
// const poimock = ('./data/parks/europapark/europapark_poi_mock.json');

/**
* Get EuropaPark data
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
* Login to the EP API
* Don't call this function unless you know what you're doing, in most cases other functions will handle it for you
*/
async function loginEP() {
  console.log(login);
  return fetch(apiBase +
    loginurl,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      login,
    },
  },
  )
      .then((res) => res.json())
      .then((loginData) => {
        console.log(loginData);
      });
}

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
module.exports.loginEP = loginEP;
module.exports.getPOIS = getPOIS;
module.exports.getOpHours = getOpHours;
module.exports.getData = getData;
module.exports.getCalendar = getCalendar;
module.exports.getWaitTime = getWaitTime;
