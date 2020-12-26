const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs');

require('dotenv').config();

//Configure the variables
const searchURL = process.env.EFTELING_SEARCH_URL;
const apiKey = process.env.EFTELING_API_KEY;

//Load the Efteling poidata
const poidata = ('./data/parks/efteling/efteling_pois.json')
const poimock = ('./data/parks/efteling/efteling_poi_mock.json')

async function getPOIS() {
  console.log(searchURL)
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
  .then(json => {
    const POIS = []
    json.hits.hit.forEach(ride => {
      if(ride.fields.category === 'attraction' && ride.fields.hide_in_app !== 'false'){
        let name = ride.fields.name
        let id = ride.id
        let latlon = ride.fields.latlon
        const latlonSplit = latlon.split(',');
        const lat = latlonSplit[0]
        const lon = latlonSplit[1]

        const poi = {
          name: name,
          id: id,
          location: {
            latitude: lat,
            longitude: lon,
          },
          meta: {
            type: ride.fields.category,
            area: ride.fields.empire,
          },
        }
        POIS.push(poi);
      }
      //console.log(POIS)
    })
    if(!poimock){
    fs.writeFile('./data/parks/efteling/efteling_poi_mock.json', JSON.stringify(json.hits.hit), function (err) {
      if (err) return console.log(err);
      console.log('Written mock file');
    });
    }
    //Insert Pois to seperate JSON file
    fs.writeFile('./data/parks/efteling/efteling_pois.json', JSON.stringify(POIS), function (err) {
      if (err) return console.log(err);
      console.log('Written pois file');
    });
  })
}

module.exports.getPOIS = getPOIS;