# Themeparks-API
Themeparks API loosely based on existing examples, however I wanted to kill some time and then this came up. Don't expect anything too cool tho.</br>

![Unit Test](https://github.com/alexvv13/tp-api/workflows/Unit%20Test/badge.svg)
![Documentation Build](https://github.com/alexvv13/tp-api/workflows/ESDoc/badge.svg)
![Node.js CI](https://github.com/alexvv13/tp-api/workflows/Node.js%20CI/badge.svg)
[![Build Status](https://api.travis-ci.com/alexvv13/tp-api.svg?branch=master)](https://travis-ci.com/alexvv13/tp-api)
[![npm version](https://badge.fury.io/js/%40alexvv13%2Ftpapi.svg)](https://badge.fury.io/js/%40alexvv13%2Ftpapi)
![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/alexvv13/tp-api.svg)

[API documentation](https://alexvv13.github.io/tp-api "API Documentation") </br>
[NPM Package](https://www.npmjs.com/package/@alexvv13/tpapi "NPM Package") </br>

## About
This is a module which fetches queue times and operating hours, and returns it as JSON to the user, the data could be used for anything, a website, a discordjs bot, some personal stuff or whatever. Be aware it's not perfect, but it works. It's just being build to work and return data, not to be efficient anyway.

## Table of Contents
[About](#about)</br>
[Table of Contents](#table-of-contents) </br>
[Install](#install) </br>
[ENV](#env) </br>
[Usage](#usage) </br>
[  -Running the script](#running-the-script) </br>
[  -Example output](#example-output) </br>
[Changelog](#changelog) </br>
[Parks available](#parks-available) </br>
[Features of supported parks](#features-of-the-parks) </br>
[Result objects](#result-objects) </br>
[  -Ride waittimes](#ride-waittimes) </br>
[  -Schedules](#schedules) </br>
[Park object values](#park-object-values) </br>
[Tasks](#tasks) </br>

## Install

    npm install @alexvv13/tpapi --save
    

## ENV
In the directory where you're using tpapi, create an .env file and fill in the fields, an example can be found in the Github Repo, or in the ${path}/node_modules/@alexvv13/tpapi/.env.example, or copy below's example and fill in the fields yourself
```
LANGUAGES= 'en'
LANG_UPPER= 'EN'

EFTELING_API_KEY= 
EFTELING_APP_VERSION= 
EFTELING_API_VERSION= 
EFTELING_API_PLATFORM= 

EFTELING_SEARCH_URL= 
EFTELING_WAITTIMES_URL= 
EFTELING_HIST_URL= 

EUROPAPARK_APIBASE= 
EUROPAPARK_LOGINSTRING= 
EUROPAPARK_LOGIN= 
EUROPAPARK_REFRESH= 

WALIBIHOLLAND_APIBASE= 
WALIBIHOLLAND_APIURL= 
WALIBIBELGIUM_APIBASE=
WALIBIRA_APIBASE=
```

## Usage
### Running the script
Run index.js for all parks </br>
NOTE: If you use commonjs, it's REQUIRED to use the .mjs extension INSTEAD of .js! </br>
Or create an .js file for yourself and do the following: </br>
```javascript
// Import all parks here
import tpapi from '@alexvv13/tpapi';

const park = new tpapi.parks.Efteling();

// Fetch POIS Example usage of Efteling
park.getWaitTime().then((poiData) => {
  console.log(poiData);
});

// You can also call getCalendar() or getData()
```

### Example output
(Shortened to keep it readable)
```javascript
{
    "name": "Stoomcarrousel",
    "id": "Efteling_stoomcarrousel",
    "waitTime": "0",
    "state": "Closed",
    "active": "false",
    "location": {
        "latitude": "51.651211",
        "longitude": "5.048955"
    },
    "meta": {
        "type": "attraction",
        "area": "Marerijk",
        "single_rider": "false"
    }
},
{
    "name": "Vogel Rok",
    "id": "Efteling_vogelrok",
    "waitTime": "0",
    "state": "Closed",
    "active": "false",
    "location": {
        "latitude": "51.652187",
        "longitude": "5.052811"
    },
    "meta": {
        "type": "attraction",
        "area": "Reizenrijk",
        "single_rider": "false"
    }
}
```
   
## Changelog

[View tp-api Changelog](CHANGELOG.md)

## Parks available

<!-- START_SUPPORTED_PARKS_LIST -->

**3** Parks Supported

* Efteling (tpapi.parks.Efteling)
* Europa-Park (tpapi.parks.EuropaPark)
* Walibi Holland (tpapi.parks.WalibiHolland)

<!-- END_SUPPORTED_PARKS_LIST -->

## Features of the parks

Park Name | Live Queues | Park Hours
------------ | ------------- | ----------
Efteling |:heavy_check_mark:|:heavy_check_mark:
Walibi Holland |:heavy_check_mark:|:heavy_multiplication_x:
Europa-Park |:heavy_check_mark:|:heavy_multiplication_x:

## Result Objects

### Ride WaitTimes

    [
        {
            id: (string or number: uniquely identifying a ride),
            name: (string: ride name),
            waitTime: (number: current wait time in minutes),
            active: (bool: is the ride currently active?),
            location: (object: contains location data such as latlon
                 latitude: (number: ride's latitude),
                 longitude: (number: ride's longitude),
            meta: { (object: can contain various park-specific information about this ride - field may be null)
                // examples of potential meta fields
                singleRider: (boolean: does this ride have a single rider line?),
                type: (string: what is this poi?),
                area: (string: section of the park this ride is located within),
            },
            status: (string: will either be "Operating", "Closed", "Refurbishment", or "Down"),
        },
        ...
    ]

### Schedules

    [
        {
            date: (dateFormat timestamp: day this schedule applies),
            openingTime: (timeFormat timestamp: opening time for requested park - can be null if park is closed),
            closingTime: (timeFormat timestamp: closing time for requested park - can be null if park is closed),
            type: (string: "Operating" or "Closed"),
            special: [ (array of "special" times for this day, usually Disney Extra Magic Hours or similar at other parks - field may be null)
              openingTime: (timeFormat timestamp: opening time for requested park),
              closingTime: (timeFormat timestamp: closing time for requested park),
              type: (string: type of schedule eg. "Extra Magic Hours", but can be "Event" or "Special Ticketed Event" or other)
            ],
        },
        ...
    ]

## Park Object values

There are some values available on each park object that may be useful.

| Variable              | Description                                                                                                 |
| :-------------------- | :---------------------------------------------------------------------------------------------------------- |
| Name                  | Name of the park                                                                                            |
| Timezone              | The park's local timezone                                                                                   |
| latitude              | This park's latitude                                                                                        |
| longitude             | This park's longitude                                                                                       |
| langoptions           | What languages does this park support?                                                                      |


## Tasks
- [ ] Add more parks
- [X] Multi language support
- [ ] Multiple Queue entities support


