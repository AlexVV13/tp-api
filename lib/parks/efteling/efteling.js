const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs');

require('dotenv').config();

// Configure the variables
const searchURL = process.env.EFTELING_SEARCH_URL;
const apiKey = process.env.EFTELING_API_KEY;
const waitTimesURL = process.env.EFTELING_WAITTIMES_URL;
const histURL = process.env.EFTELING_HIST_URL;
const language = process.env.LANGUAGE;

// Create Efteling park options such as latlon and timezone
const options = {
  name: 'Efteling',
  timezone: 'Europe/Amsterdam',
  latitude: 51.64990915659694,
  longitude: 5.043561458587647,
};

// Last edited time of mocks
const getFileUpdatedDate = (path) => {
  const stats = fs.statSync(path);
  return stats.mtime;
};

// Load the Efteling poidata
const poidata = ('./data/parks/efteling/efteling_pois.json');
const poimock = ('./data/parks/efteling/efteling_poi_mock.json');

/**
* Get Efteling data
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
* Get Efteling POI data
* This data contains general ride names, descriptions etc.
*/
async function getPOIS() {
  return fetch(searchURL +
    `search?q.parser=structured&size=1000&q=(and (phrase field%3Dlanguage '$${language}'))`,
  {
    method: 'GET',
    headers: {
      Authorization: apiKey,
    },
  },
  )
      .then((res) => res.json())
      .then((rideData) => {
        const poi = {};
        rideData.hits.hit.forEach((ride) => {
          if (ride.fields.category === 'attraction' && ride.fields.hide_in_app !== 'false') {
            if (ride.fields.alternateid && ride.fields.alternateid.indexOf('singlerider')) {
              singlerider = 'true'; // Initial single rider implementation
            } else {
              singlerider = 'false';
            }
            // Split the language specific part out
            const ids = ride.id;
            const idSplit = ids.split('-');
            const id = idSplit[0];
            // Split latlon
            const latlon = ride.fields.latlon;
            const latlonSplit = latlon.split(',');
            const lat = latlonSplit[0];
            const lon = latlonSplit[1];

            // Poi Object
            poi[id] = {
              name: ride.fields.name,
              id: id,
              waitTime: null,
              state: null,
              active: null,
              location: {
                latitude: lat,
                longitude: lon,
              },
              meta: {
                single_rider: singlerider,
                type: ride.fields.category,
                area: ride.fields.empire,
              },
            };
          }
        });
        if (moment().diff(getFileUpdatedDate(poidata), 'hours') >= '24') { // Refresh cache every 24 hours
          fs.writeFile('./data/parks/efteling/efteling_pois.json', JSON.stringify(poi, null, 4), function(err) {
            if (err) return console.log(err);
          });
        };
        if (moment().diff(getFileUpdatedDate(poimock), 'hours') >= '24') { // Refresh cache every 24 hours
          fs.writeFile('./data/parks/efteling/efteling_poi_mock.json', JSON.stringify(rideData.hits.hit, null, 4), function(err) {
            if (err) return console.log(err);
          });
        };
        return Promise.resolve(poi);
      });
}

/**
* Get Efteling QueueTimes data
* This data contains the queue data, we'll assign them to the earlier fetched pois
*/
async function getQueue() {
  return await getPOIS().then((rideData) => fetch(waitTimesURL,
      {
        method: 'GET',
      },
  )
      .then((res) => res.json())
      .then((json) => {
        const rides = [];
        // Park is closed, and nothing is returned, attach that here.
        if (!json.AttractionInfo.length) {
          Object.keys(rideData).forEach((ride) => {
          // Update the variables to the closed rides
            rideData[ride].waitTime = '0';
            rideData[ride].state = 'Closed';
            rideData[ride].active = 'false';
            // Create the ride Object
            const rideobj = {
              name: rideData[ride].name,
              id: rideData[ride].id,
              waitTime: rideData[ride].waitTime,
              state: rideData[ride].state,
              active: rideData[ride].active,
              location: {
                latitude: rideData[ride].location.latitude,
                longitude: rideData[ride].location.longitude,
              },
              meta: {
                type: rideData[ride].meta.type,
                area: rideData[ride].meta.area,
                single_rider: rideData[ride].meta.single_rider,
              },
            };
            rides.push(rideobj);
          });

          return Promise.resolve(rides);
        }

        // If there are rides listed, fetch them here.
        json.AttractionInfo.forEach((ridetime) => {
          /* let id = ridetime.id;
          let waittime = ridetime.waitingtime;
          let state = ridetime.state;
        Object.keys(rideData).forEach((ride) => {
          //Update the variables to the closed rides
          rideData[ride].waitTime = waittime
          rideData[ride].state = state
          rideData[ride].active = active
          //Create the ride Object
          let rideobj = {
            name: rideData[ride].name,
            id: rideData[ride].id,
            waitTime: rideData[ride].waitTime,
            state: rideData[ride].state,
            active: rideData[ride].active,
            location: {
              latitude: rideData[ride].location.latitude,
              longitude: rideData[ride].location.longitude,
            },
            meta: {
              type: rideData[ride].meta.type,
              area: rideData[ride].meta.area,
              single_rider: rideData[ride].meta.single_rider,
            }
          }
          rides.push(rideobj)
        }) */
        });
      }),
  );
};

/**
* Get Efteling Park Hours data
* This data contains the hours data, used to display the operating hours of Efteling
*/
async function getOpHours() {
  const currentYear = moment().format('YYYY');
  const currentMonth = moment().format('MM');

  return fetch(
      histURL +
      `${currentYear}/${currentMonth}`,
      {
        method: 'GET',
      },
  )
      .then((res) => res.json())
      .then((json) => {
        const Calendar = [];
        if (!json.OpeningHours.length) {
          // Park is closed, do nothing but returning today as empty string
          const hours = {
            date: moment().format('YYYY-MM-DD'),
            type: 'Closed',
            openingTime: moment('23:59', 'HH:mm a').format(),
            closingTime: moment('23:59', 'HH:mm a').format(),
            special: [],
          };
          Calendar.push(hours);
        } else {
          // Return the actual opening hours
          json.OpeningHours.forEach((cal) => {
            let date = moment.tz(`${cal.Date}`, 'YYYY-MM-DD', 'Europe/Amsterdam');
            date = moment(date).format('YYYY-MM-DD');
            cal.OpeningHours.forEach((cal1) => {
              let open = moment.tz(`${date}${cal1.Open}`, 'YYYY-MM-DDHH:mm', 'Europe/Amsterdam');
              open = moment(open).format();
              let close = moment.tz(`${date}${cal1.Close}`, 'YYYY-MM-DDHH:mm', 'Europe/Amsterdam');
              close = moment(close).format();
              const type = 'Operating';

              const hours = {
                closingTime: close,
                openingTime: open,
                type: type,
                special: [],
                date: date,
              };
              Calendar.push(hours);
            });
          });
        };
        return Promise.resolve(Calendar);
      });
}

/**
* Get All Efteling data in console
* This data contains all the data of Efteling, returned as json object
*/
async function getData() {
  return await Promise.all([getQueue(), getOpHours()]).then((rides) => {
    console.log(JSON.stringify(rides, null, 4));
  });
}

/**
* Get Efteling Park Hours data in console
* This data contains the hours data, used to display the operating hours of Efteling
*/
async function getCalendar() {
  return await getOpHours().then((calendar) => {
    console.log(calendar);
  });
}

/**
* Get Efteling Queuetimes data in console
* This data contains the queuetimes data, used to display the queuetimes of Efteling
*/
async function getWaitTime() {
  return await getQueue().then((rides) => {
    console.log(rides);
  });
}

module.exports.getPark = getPark;
module.exports.getPOIS = getPOIS;
module.exports.getQueue = getQueue;
module.exports.getOpHours = getOpHours;
module.exports.getData = getData;
module.exports.getCalendar = getCalendar;
module.exports.getWaitTime = getWaitTime;
