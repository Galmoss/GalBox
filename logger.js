var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream('./logs/node.access.log', {flags : 'w'});


function write(str) 
{ 
	var currentdate = new Date(); 
	var datetime = "[" + currentdate.getDate() + "/"
					+ (currentdate.getMonth()+1)  + "/" 
					+ currentdate.getFullYear() + " - "  
					+ currentdate.getHours() + ":"  
					+ currentdate.getMinutes() + ":" 
					+ currentdate.getSeconds() + "]";
	log_file.write(util.format(datetime+ ": " +str) + '\n');
};

exports.write = write;
