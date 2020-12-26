const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs');

require('dotenv').config();

//Configure the variables
const apiBase = process.env.WALIBIHOLLAND_APIBASE;
const apiUrl = process.env.WALIBIHOLLAND_APIURL;

//Load the Walibi Holland poidata
const poidata = ('./data/parks/walibi/walibiholland_pois.json')
const poimock = ('./data/parks/walibi/walibiholland_poi_mock.json')

async function getPOIS() {
  return fetch(apiUrl ,
    {
      method: 'GET',
    },      
  )
  .then(res => res.json())
  .then(rideData => {
    const poi = [];
    rideData.forEach(ride => {
        if(ride.name !== 'Dummy1'){
            if(ride.useVirtualQueue == 'true'){
                waitTime = Math.round(ride.waitTimeMins)
            }else{
                waitTime = ride.minWait / 60
            }
            if(ride.state === 'closed_indefinitely'){
                state = 'Closed',
                active = 'false'
            } //Declare other states when park reopens
            const poiData = {
                name: ride.name,
                id: ride.shortId,
                state: state,
                active: active,
                waitTime: waitTime,
                meta: {
                    type: 'attraction',
                }          
            }
            poi.push(poiData);
        }
    })
    fs.writeFile('./data/parks/walibi/walibiholland_pois.json', JSON.stringify(poi, null, 4), function (err) {
      if (err) return console.log(err);
    });
    fs.writeFile('./data/parks/walibi/walibiholland_poi_mock.json', JSON.stringify(rideData, null, 4), function (err) {
      if (err) return console.log(err);
    });
    return Promise.resolve(poi) //Although we saved them in a json file, we'll just return them for the queue attach function which will run next if you called getQueue()
  })
}

async function getOpHours(){
  const currentYear = moment().format('YYYY')
  return fetch(
    apiBase + 
    `/calendar/${currentYear}?_format=json`,
    {
      method: 'GET'
    }
  )
  .then(res => res.json())
  .then(json => {
    var Calendar = []
    //Execute Calendar stuff here
    return Promise.resolve(Calendar);
  })
}

async function getData(){
  return await Promise.all([this.getPOIS(), this.getOpHours()]).then(rides => {
    console.log(JSON.stringify(rides, null, 4))
  });
}

async function getCalendar(){
  return await this.getOpHours().then(calendar => {
    console.log(calendar);
  })
}

async function getWaitTime(){
  return await this.getPOIS().then(rides => {
    console.log(rides);
  })
}

module.exports.getPOIS = getPOIS;
module.exports.getOpHours = getOpHours;
module.exports.getData = getData;
module.exports.getCalendar = getCalendar;
module.exports.getWaitTime = getWaitTime;