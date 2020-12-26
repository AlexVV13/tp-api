# Themeparks-API
Themeparks API loosely based on existing examples, however I wanted to kill some time and then this came up. Don't expect anything too cool tho.

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
$ git clone https://github.com/AlexVV13/tp-api.git
``` 
Now the repository is cloned in your document root, install the dependencies now
### Dependencies
First, install the dependencies, this can be easily achieved by running npm:</br>
``` 
$ npm i
``` 
### ENV
After that, fill in the .env fields, using some research this could be an easy task. 

## Usage
### Running the script
Run index.js for all parks </br>
Or create an .js file for yourself and do the following: </br>
```javascript
//Import the park
const Parks = require('./data/parks/index')

//Run whatever you want
Parks.${parkName}.getData();
```
   
## Currently Working Parks
Park Name | Live Queues | Park Hours
------------ | ------------- | ----------
Efteling |:heavy_check_mark:|:heavy_check_mark:

## Tasks
- [ ] Add more parks
- [ ] Multi language support
- [ ] Multiple Queue entities support
- [x] Timezone support


