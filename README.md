# Themeparks-API
Themeparks API loosely based on existing examples, however I wanted to kill some time and then this came up. Don't expect anything too cool tho.
[API documentation](https://alexvv13.github.io/tp-api "API Documentation")
Current Version: 1.0.6

## About
This is a module which fetches queue times and operating hours, and returns it as JSON to the user, the data could be used for anything, a website, a discordjs bot, some personal stuff or whatever. Be aware it's not perfect, but it works. It's just being build to work and return data, not to be efficient anyway.

## Table of Contents
[About](#about)</br>
[Table of Contents](#table-of-contents)</br>
[Requirements](#requirements)</br>
[  -Applications](#applications)</br>
[  -Node Modules](#node-modules)</br>
[  -Other](#other)</br>
[Setup](#setup)</br>
[  -Dependencies](#dependencies)</br>
[  -ENV](#env)</br>
[Usage](#usage)</br>
[  -Viewing](#viewing)</br>
[Park List](#currently-working-parks)</br>
[Tasks](#tasks)</br>

## Requirements
### Applications
- Git
- Latest version of Nodejs
- Other applications are dependent on whatever you want.

### Node Modules
- All included in package.json

### Other
- A working pc perhaps

## Setup
### Clone the repository
First, clone the repository
``` 
$ npm i @alexvv13/tpapi
``` 
Now the repository is cloned in your document root, install the dependencies now
### Dependencies
Dependencies are now being installed with the package
### ENV
In the directory where you're using tpapi, create an .env file and fill in the fields, an example can be found in the Github Repo, or in the ${path}/node_modules/@alexvv13/tpapi/.env.example

## Usage
### Running the script
Run index.js for all parks </br>
NOTE: If you use commonjs, it's REQUIRED to use the .mjs extension INSTEAD of .js! </br>
Or create an .js file for yourself and do the following: </br>
```javascript
// Import all parks here
import tpapi from '@alexvv13/tpapi'; // 

const park = new tpapi.parks.EuropaPark(); 

// Fetch POIS
park.getWaitTime(); // Fetch the queues for, in this example, EuropaPark
```

Example output (Shortened to keep it readable)
```json
{
  '5003': {
    name: 'VirtualLine: Arthur',
    id: 'Europapark_5003',
    waitTime: null,
    state: null,
    active: null,
    location: { latitude: 48.26387625, longitude: 7.72408623 },
    meta: { area: 'Kingdom of the Minimoys', type: 'attraction', single_rider: 'false' }
  },
  '5004': {
    name: 'VirtualLine: Eurosat - CanCan Coaster',
    id: 'Europapark_5004',
    waitTime: null,
    state: null,
    active: null,
    location: { latitude: 48.267345, longitude: 7.72113 },
    meta: { area: 'France', type: 'attraction', single_rider: 'false' }
  },
  '5005': {
    name: 'VirtualLine: Piraten in Batavia',
    id: 'Europapark_5005',
    waitTime: null,
    state: null,
    active: null,
    location: { latitude: 48.26371636, longitude: 7.7203537 },
    meta: { area: 'Netherlands', type: 'attraction', single_rider: 'false' }
  }
}
```
   
## Currently Working Parks
Park Name | Live Queues | Park Hours
------------ | ------------- | ----------
Efteling |:heavy_check_mark:|:heavy_check_mark:
Walibi Holland |:heavy_check_mark:|:heavy_multiplication_x:
Europa-Park |:heavy_check_mark:|:heavy_multiplication_x:

## Tasks
- [ ] Add more parks
- [ ] Multi language support
- [ ] Multiple Queue entities support


