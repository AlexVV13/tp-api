const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs');

require('dotenv').config();

//Configure the variables
const searchURL = process.env.EFTELING_SEARCH_URL;
const apiKey = process.env.EFTELING_API_KEY;
const waitTimesURL = process.env.EFTELING_WAITTIMES_URL;

//Load the Efteling poidata
const poidata = ('./data/parks/efteling/efteling_pois.json')
const poimock = ('./data/parks/efteling/efteling_poi_mock.json')

async function getPOIS() {
  fetch(searchURL + 
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
          location: {
            latitude: lat,
            longitude: lon,
          },
          meta: {
            type: ride.fields.category,
            area: ride.fields.empire,
          },
        }
      }
      //console.log(POIS)
    })
    if(!poimock){
    fs.writeFile('./data/parks/efteling/efteling_poi_mock.json', JSON.stringify(rideData.hits.hit), function (err) {
      if (err) return console.log(err);
      console.log('Written mock file');
    });
    }
    //console.log(poi);
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
      console.log(rideData);
    })
  )
}

module.exports.getPOIS = getPOIS;
module.exports.getQueue = getQueue;