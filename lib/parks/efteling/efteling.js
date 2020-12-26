const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs');

require('dotenv').config();

//Configure the variables
const searchURL = process.env.EFTELING_SEARCH_URL;
const apiKey = process.env.EFTELING_API_KEY;
const waitTimesURL = process.env.EFTELING_WAITTIMES_URL;
const histURL = process.env.EFTELING_HIST_URL;

//Load the Efteling poidata
const poidata = ('./data/parks/efteling/efteling_pois.json')
const poimock = ('./data/parks/efteling/efteling_poi_mock.json')

async function getPOIS() {
  return fetch(searchURL + 
    `search?q.parser=structured&size=1000&q=(and (phrase field%3Dlanguage '$en'))`,
    {
      method: 'GET',
      headers: {
        Authorization: apiKey,
      },
    },      
  )
  .then(res => res.json())
  .then(rideData => {
    const poi = {};
    rideData.hits.hit.forEach(ride => {
      if(ride.fields.category === 'attraction' && ride.fields.hide_in_app !== 'false'){
        if(ride.fields.alternateid && ride.fields.alternateid.indexOf('singlerider')){
          var singlerider = 'true'; //Initial single rider implementation, since the park is closed I can't really do more then this anyway
        } else {
          var singlerider = 'false';
        }
        //Split the language specific part out
        const ids = ride.id;
        const idSplit = ids.split('-');
        const id = idSplit[0];
        //Split latlon
        const latlon = ride.fields.latlon
        const latlonSplit = latlon.split(',');
        const lat = latlonSplit[0]
        const lon = latlonSplit[1]

        //Poi Object
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
        }
      }
    })
    fs.writeFile('./data/parks/efteling/efteling_pois.json', JSON.stringify(poi, null, 4), function (err) {
      if (err) return console.log(err);
    });
    fs.writeFile('./data/parks/efteling/efteling_poi_mock.json', JSON.stringify(rideData.hits.hit, null, 4), function (err) {
      if (err) return console.log(err);
    });
    return Promise.resolve(poi) //Although we saved them in a json file, we'll just return them for the queue attach function which will run next if you called getQueue()
  })
}

async function getQueue(){
  return await this.getPOIS().then(rideData => fetch(waitTimesURL,
      {
        method: 'GET',
      },
    )
    .then(res => res.json())
    .then(json => {
      var rides = []
      //Park is closed, and nothing is returned, attach that here.
      if(!json.AttractionInfo.length) {
        Object.keys(rideData).forEach((ride) => {
          //Update the variables to the closed rides
          rideData[ride].waitTime = '0'
          rideData[ride].state = 'Closed'
          rideData[ride].active = 'false'
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
        });

        return Promise.resolve(rides);
      }

      //If there are rides listed, fetch them here.
      json.AttractionInfo.forEach(ridetime => {
        let id = ridetime.id
        let waittime = ridetime.waitingtime
        let state = ridetime.state
/*        Object.keys(rideData).forEach((ride) => {
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
      })
    })
  )
}

async function getOpHours(){
  const currentYear = moment().format('YYYY')
  const currentMonth = moment().format('MM')

  return fetch(
    histURL + 
    `${currentYear}/${currentMonth}`,
    {
      method: 'GET'
    }
  )
  .then(res => res.json())
  .then(json => {
    var Calendar = []
    if(!json.OpeningHours.length){
      //Park is closed, do nothing but returning today as empty string
      let hours = {
        date: moment().format('YYYY-MM-DD'),
        type: 'Closed',
        openingTime: moment('23:59', 'HH:mm a').format(),
        closingTime: moment('23:59', 'HH:mm a').format(),
        special: []
      }
      Calendar.push(hours)
    } else {
      //Return the actual opening hours
      json.OpeningHours.forEach(cal => {
        var date = moment.tz(`${cal.Date}`, 'YYYY-MM-DD', 'Europe/Amsterdam')
        var date = moment(date).format('YYYY-MM-DD');
        cal.OpeningHours.forEach(cal1 => {
          var open = moment.tz(`${date}${cal1.Open}`, 'YYYY-MM-DDHH:mm', 'Europe/Amsterdam');
          var open = moment(open).format();
          var close = moment.tz(`${date}${cal1.Close}`, 'YYYY-MM-DDHH:mm', 'Europe/Amsterdam');
          var close = moment(close).format();
          var type = "Operating"  

          var hours = {
            closingTime: close,
            openingTime: open,
            type: type,
            special: [],
            date: date
          }
          Calendar.push(hours);
        })
      })
    }
    return Promise.resolve(Calendar);
  })
}

async function getData(){
  return await Promise.all([this.getQueue(), this.getOpHours()]).then(rides => {
    console.log(JSON.stringify(rides, null, 4))
  });
}

async function getCalendar(){
  return await this.getOpHours().then(calendar => {
    console.log(calendar);
  })
}

async function getWaitTime(){
  return await this.getQueue().then(rides => {
    console.log(rides);
  })
}

module.exports.getPOIS = getPOIS;
module.exports.getQueue = getQueue;
module.exports.getOpHours = getOpHours;
module.exports.getData = getData;
module.exports.getCalendar = getCalendar;
module.exports.getWaitTime = getWaitTime;