# Themeparks-API
Themeparks API loosely based on existing examples, however I wanted to kill some time and then this came up. Don't expect anything too cool tho.</br>

![Unit Test](https://github.com/alexvv13/tp-api/workflows/Unit%20Test/badge.svg)
![Documentation Build](https://github.com/alexvv13/tp-api/workflows/ESDoc/badge.svg)
![Node.js CI](https://github.com/alexvv13/tp-api/workflows/Node.js%20CI/badge.svg)

![node-current](https://img.shields.io/node/v/@alexvv13/tpapi)
[![npm version](https://badge.fury.io/js/%40alexvv13%2Ftpapi.svg)](https://badge.fury.io/js/%40alexvv13%2Ftpapi) </br>

![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/alexvv13/tp-api.svg) </br>

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

    yarn add @alexvv13/tpapi
    

## ENV
In the directory where you're using tpapi, create an .env file and fill in the fields, an example can be found in the Github Repo, or in the ${path}/node_modules/@alexvv13/tpapi/.env.example, or copy below's example and fill in the fields yourself
```
#Language
LANGUAGES= 'en'

#Efteling
EFTELING_API_KEY=
EFTELING_SEARCH_URL= 
EFTELING_WAITTIMES_URL= 
EFTELING_HIST_URL= 

#Europa-Park
EUROPAPARK_APIBASE=
EUROPAPARK_LOGIN=
EUROPAPARK_FBAPPID=
EUROPAPARK_FBAPIKEY=
EUROPAPARK_FBPROJECTID=
EUROPAPARK_ENCKEY=
EUROPAPARK_ENCIV=

#Phantasialand
PHANTASIALAND_API_KEY=
PHANTASIALAND_POI_URL=
PHANTASIALAND_WAITTIMES_URL=
PHANTASIALAND_HOURS_URL=

#Toverland
TOVERLAND_APIBASE= 
TOVERLAND_TOKEN= 
TOVERLAND_HOURS=

#Compagnie des Alpes
WALIBIHOLLAND_APIBASE= 
WALIBIHOLLAND_APIURL= 
WALIBIBELGIUM_APIBASE=
WALIBIRA_APIBASE=
BELLEWAERDE_APIBASE=

#Settings
CACHE_DURATION_POIS= '12'
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
[
  {
    "name": "Stoomcarrousel",
    "id": "Efteling_stoomcarrousel",
    "type": "Attraction",
    "location": {
       "area": "Marerijk",
       "latitude": 51.651211,
       "longitude": 5.048955
    },
    "queues": {
       "fastPass": {
          "fastPass": false
       },
       "singlerider": {
          "singleRider": false
       },
       "standBy": {
          "waitTime": 0,
          "status": "Closed",
          "active": false
       }
    },
    "meta": {
       "descriptions": {
        "description":"<p>Would you like a horse, a carriage, a pig or another vehicle? Take your seat in the ‘Stoomcarrousel’ steam carousell, which is more than 100 years old, and lit it spin you around! Duration: varies.   Wheelchair access: via the exit from this attraction.</p>",
        "short_description":"The old-fashioned fairground feeling"
       },
       "restrictions": {
          "minHeightAccompanied": "100 cm"
       },
       "tags": [
          "tranferNecessary",
          "IndoorRide"
       ]
    }
  },
  {
    "name": "Vogel Rok",
    "id": "Efteling_vogelrok",
    "type": "Attraction",
    "location": {
       "area": "Reizenrijk",
       "latitude": 51.652187,
       "longitude": 5.052811
    },
    "queues": {
       "fastPass": {
          "fastPass": false
       },
       "singlerider": {
          "singleRider": false
       },
       "standBy": {
          "waitTime": 0,
          "status": "Closed",
          "active": false
       }
    },
    "meta": {
       "descriptions": {
          "description": "<p>The Vogel Rok is an exiting indoor rollercoaster in the dark. The rollercoaster does not completely turn over, but does zoom through the dark at 40 mph. You must be at least 1.20 meter tall for this attraction. Duration: almost 2 minutes.   Wheelchair access: via the usual entrance to this attraction until the bottom of the stairs. Call here. An employee will then come to meet you.</p>",
          "short_description": "Lightning in the dark"
       },
       "restrictions": {
          "minHeight": "120 cm"
       },
       "tags": [
          "mayGetDizzy",
          "unsuitableForPregnantWomen",
          "tranferNecessary",
          "unsuitableWithInjuries",
          "IndoorRide"
       ]
    }
  }
]
```
   
## Changelog

[View tp-api Changelog](CHANGELOG.md)

## Parks available

<!-- START_SUPPORTED_PARKS_LIST -->

**10** Parks Supported

* Efteling (tpapi.parks.Efteling)
* Europa-Park (tpapi.parks.EuropaPark)
* Rulantica (tpapi.parks.Rulantica)
* YULLBE (tpapi.parks.Yullbe)
* Phantasialand (tpapi.parks.Phantasialand)
* Toverland (tpapi.parks.Toverland)
* Walibi Holland (tpapi.parks.WalibiHolland)
* Walibi Belgium (tpapi.parks.WalibiBelgium)
* Walibi Rhône-Alpes (tpapi.parks.WalibiRA)
* Bellewaerde (tpapi.parks.Bellewaerde)

<!-- END_SUPPORTED_PARKS_LIST -->

## Features of the parks

Park Name | Live Queues | Park Hours | Ride Schedules | Languages
------------ | ------------- | ---------- | ------------- | -------------
Efteling |:heavy_check_mark:|:heavy_check_mark:|:heavy_multiplication_x:|en, nl, de, fr
Europa-Park |:heavy_check_mark:|:heavy_multiplication_x:|:heavy_multiplication_x:|en, de, fr
Rulantica |:heavy_check_mark:|:heavy_multiplication_x:|:heavy_multiplication_x:|en, de, fr
YULLBE |:heavy_check_mark:|:heavy_multiplication_x:|:heavy_multiplication_x:|en, de, fr
Phantasialand |:heavy_check_mark:|:heavy_multiplication_x:|:heavy_check_mark:|en, nl, de, fr
Toverland |:heavy_check_mark:|:heavy_check_mark:|:heavy_check_mark:|en, nl, de
Walibi Holland |:heavy_check_mark:|:heavy_check_mark:|:heavy_multiplication_x:|en
Walibi Belgium |:heavy_check_mark:|:heavy_check_mark:|:heavy_multiplication_x:|en
Walibi Rhône-Alpes |:heavy_check_mark:|:heavy_check_mark:|:heavy_multiplication_x:|en
Bellewaerde |:heavy_check_mark:|:heavy_check_mark:|:heavy_multiplication_x:|en

## Result Objects

### Ride WaitTimes

    [
        {
            id: (string or number: uniquely identifying a ride),
            name: (string: ride name),
            waitTime: (number: current wait time in minutes),
            active: (bool: is the ride currently active?),
            state: (string: will either be "Operating", "Closed", "Refurbishment", or "Down"),
            location: (object: contains location data such as latlon
                 latitude: (number: ride's latitude),
                 longitude: (number: ride's longitude),
                 area: (string: what area is this ride in?)
            meta: { (object: can contain various park-specific information about this ride - field may be null)
                // examples of potential meta fields
                description: { (object: can contain ride descriptions)
                },
                single_rider: (boolean: does this ride have a single rider line?),
                type: (string: what is this poi?),
                fastPass: (boolean: does this ride have a fastPass line?),
                isVirtQueue: (boolean: is this entity a Virtual Queue?),
                tags: { (object: can contain various ride-specific tags, can be null and fields differ per park)
                },
                restrictions: { (object: can contain various ride-specific restrictions(minHeight etc), can be null and fields differ per park)
                },
            },
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
            special: [ (array of "special" times for this day, usually exclusive hours - field may be null)
              openingTime: (timeFormat timestamp: opening time for requested park),
              closingTime: (timeFormat timestamp: closing time for requested park),
              type: (string: type of schedule eg. "Passholder Event", but can be "Event" or "Special Ticketed Event" or other)
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
| LocationString        | This park's location as a [latitude, longitude] string                                                                |
| SupportsWaitTimes     | Does this park's API support ride wait times?                                                               |
| SupportsOpeningTimes  | Does this park's API support opening hours?                                                                 |
| SupportsRideSchedules | Does this park return schedules for rides?                                                                  |
| FastPass              | Does this park have FastPass (or a FastPass-style service)?                                                 |
| FastPassReturnTimes   | Does this park tell you the FastPass return times?                                                          |
| Now                   | Current date/time at this park (returned as a Moment object)                                                |
| LangOptions             | What languages does this park support? ||

    import tpapi from '@alexvv13/tpapi';

    // construct our park objects and keep them in memory for fast access later
    const Parks = {};
    for (const park in tpapi.parks) {
      Parks[park] = new tpapi.parks[park]();
    }

    // print each park's name, current location, and timezone
    for (const park in Parks) {
      console.log(`* ${Parks[park].Name} [${Parks[park].LocationString}]: (${Parks[park].Timezone})`);
    }

Prints:

<!-- START_PARK_TIMEZONE_LIST -->

* Efteling [51.65098350641645, 5.049916835374731]: (Europe/Amsterdam)
* Europa-Park [48.266140769976715, 7.722050520358709]: (Europe/Berlin)
* Rulantica [48.2605514, 7.7386819]: (Europe/Berlin)
* YULLBE [48.266140769976715, 7.722050520358709]: (Europe/Berlin)
* Phantasialand [50.798954, 6.879314]: (Europe/Berlin)
* Toverland [51.397673285726114, 5.981651557822892]: (Europe/Amsterdam)
* Walibi Belgium [50.7038852, 4.5960371]: (Europe/Brussels)
* Walibi Holland [52.4390338, 5.7665651]: (Europe/Amsterdam)
* Walibi Rhône-Alpes [45.6198928, 5.5669562]: (Europe/Paris)
* Bellewaerde [50.846996, 2.947948]: (Europe/Brussels)

<!-- END_PARK_TIMEZONE_LIST -->

## Tasks
- [ ] Add more parks
- [X] Multi language support
- [ ] Multiple Queue entities support
- [X] Merge shared tasks to one function
- [X] Generate a better infrastructure
- [X] Multi Language support for CDA parks
- [X] Update EuropaPark to new API (current setup still works but unsure for how long it'll work)
- [-] Update output

