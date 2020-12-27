import fetch from 'node-fetch';
import fs from 'fs';

import dotenv from 'dotenv';
dotenv.config();

/**
* EuropaPark Park Object
*/
export class EuropaPark {
  /**
   * Create a new EuropaPark Park object
   * @param {object} options
   */
  constructor() {
    this.name = 'Europa-Park';

    // Setting the parks entrance as latlon
    this.latutude = 48.266140769976715;
    this.longitude = 7.722050520358709;

    this.timezone = 'Europe/Berlin';

    this.apiBase = process.env.EUROPAPARK_APIBASE;
    this.login = process.env.EUROPAPARK_LOGINSTRING;
    this.loginurl = process.env.EUROPAPARK_LOGIN;
    this.refresh = process.env.EUROPAPARK_REFRESH;

    this.language = process.env.LANGUAGE;

    if (!this.apiBase) throw new Error('Missing EuropaPark apibase!');
    if (!this.login) throw new Error('Missing EuropaPark login credentials');
    if (!this.loginurl) throw new Error('Missing EuropaPark login URL!');
    if (!this.refresh) throw new Error('Missing EuropaPark refresh url!');
    if (!this.language) {
      this.language = 'en';
    }

    this.langoptions = `{'en', 'fr', 'de'}`;
  }

  // Load the Europapark poidata
  // const poidata = ('./data/parks/europapark/europapark_pois.json')
  // const poimock = ('./data/parks/europapark/europapark_poi_mock.json')

  /**
  * Login to EuropaPark API
  * NEVER call this method without calling refresh() or getPOIS()!
  * @return {string} EuropaPark refresh token
  */
  async loginEP() {
    return fetch(this.apiBase +
      this.loginurl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: this.login,
    },
    )
        .then((res) => res.json())
        .then((login) => {
          const refreshtoken = {'refresh_token': login.refresh_token};
          return Promise.resolve(refreshtoken);
        });
  }

  /**
  * Refresh your just obtained ep token
  * Tokens are 6 hrs valid, however there's no point in just calling this function without queues or sth else
  * @return {string} EuropaPark JWT Token
  */
  async refreshEP() {
    return await this.loginEP().then((refreshtoken) => fetch(this.apiBase +
        this.refresh,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(refreshtoken),
    },
    )
        .then((res) => res.json())
        .then((jwt) => {
          const jwttoken = 'Bearer ' + jwt.token;
          return Promise.resolve(jwttoken);
        }),
    );
  };

  /**
  * Get All POIS of EuropaPark
  * This data contains all the POIS in EuropaPark
  */
  async getPOIS() {
    return await this.refreshEP().then((jwttoken) => {
      fetch(this.apiBase +
        `pois/${this.language}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'JWTAuthorization': jwttoken,
        },
      },
      )
          .then((res) => res.json())
          .then((rideData) => {
            const poi = {};
            rideData.pois.forEach((ride) => {
              if (ride.type === 'attraction' && ride.code !== null) { // Return rides and pois which haven't null
                if (ride.name.indexOf('Queue - ') === 0) return; // Ignore the Queue Pointers
                let area = 'Germany'; // Really, this is the strangest empire thing ever
                if (ride.areaId == 26) {
                  area = 'Switzerland';
                }
                poi[ride.code] = {
                  name: ride.name,
                  id: 'Europapark_' + ride.code,
                  waitTime: null,
                  state: null,
                  active: null,
                  location: {
                    latitude: ride.latitude,
                    longitude: ride.longitude,
                  },
                  meta: {
                    area: area,
                    type: ride.type,
                    single_rider: 'false',
                  },
                };
              };
            });
            fs.writeFile('./data/parks/europapark/europapark_pois.json', JSON.stringify(poi, null, 4), function(err) {
              if (err) return console.log(err);
            });
            fs.writeFile('./data/parks/europapark/europapark_poi_mock.json', JSON.stringify(rideData.pois, null, 4), function(err) {
              if (err) return console.log(err);
            });
            console.log(poi);
            return Promise.resolve(poi);
          });
    });
  };

  /**
  * Get All Queues of EuropaPark
  * This data contains all the Queues in EuropaPark, attached with pois above.
  */
  async getQueue() {
    return await Promise.all([this.getPOIS(), this.refreshEP()]).then((rideData) => {
      fetch(this.apiBase +
        `waitingtimes`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'JWTAuthorization': rideData[1],
        },
      },
      )
          .then((res) => res.json())
          .then((poiData) => {
            console.log(rideData[0]);
          });
    });
  }

  /**
  * Get All Operating Hours of EuropaPark
  * This data contains all the Operating Hours in EuropaPark, fetched with currentyear.
  */
  async getOpHours() {
    return fetch(
        this.apiBase +
          `europapark/opentime/`,
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
  * Get All Data of EuropaPark
  * This data contains all EP's data, which is fetched earlier
  */
  async getData() {
    return await Promise.all([this.getPOIS(), this.getOpHours()]).then((rides) => {
      console.log(JSON.stringify(rides, null, 4));
    });
  }

  /**
  * Get All Calendar Data of EuropaPark
  * This data contains all the calendar data of EuropaPark
  */
  async getCalendar() {
    return await this.getOpHours().then((calendar) => {
      console.log(calendar);
    });
  }

  /**
  * Get All Queues of EuropaPark
  * This data contains all the Queues in EuropaPark
  */
  async getWaitTime() {
    return await this.getPOIS().then((rides) => {
      console.log(rides);
    });
  }
};

export default EuropaPark;
