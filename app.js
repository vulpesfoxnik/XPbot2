//adapted from https://github.com/AelithBlanchett/fchatlib/blob/master/test/app.js
var FChatLib = require('fchatlib');
var fs = require('fs');
var options = JSON.parse(fs.readFileSync("settings.json"));
var myFchatBot = new FChatLib(options);
console.log("ok");
