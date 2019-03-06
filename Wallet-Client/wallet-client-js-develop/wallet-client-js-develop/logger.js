var fs = require('fs');

// next we'll want make our Logger object available
// to whatever file references it.
var Logger = exports.Logger = {};


// Create 3 sets of write streams for the 3 levels of logging we wish to do
// every time we get an error we'll append to our error streams, any debug message
// to our debug stream etc...
var infoStream = fs.createWriteStream('logs/testloginfo.log');
var errorStream = fs.createWriteStream('logs/testlogerror.log');
//createWriteStream takes in options as a second, optional parameter
//if you wanted to set the file encoding of your output file you could
//do so by setting it like so: ('logs/debug.txt' , { encoding : 'utf-8' });
var debugStream = fs.createWriteStream('logs/testlogdebug.log');

Logger.info = function(msg) {
	  var message = new Date().toISOString() + " : " + msg + "\n";
	  infoStream.write(message);
	};

	Logger.debug = function(msg) {
	  var message = new Date().toISOString() + " : " + msg + "\n";
	  debugStream.write(message);
	};

	Logger.error = function(msg) {
	  var message = new Date().toISOString() + " : " + msg + "\n";
	  errorStream.write(message);
	};
