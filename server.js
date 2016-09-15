var http = require("http"),
	url = require("url");

var logger = require("./logger");

function start(route, handle) 
{
	function onRequest(request, response) 
	{
		var pathname = url.parse(request.url).pathname;
		logger.write("Request for " + pathname + " received.");
		route(handle, pathname, response, request);
	 }

	 http.createServer(onRequest).listen(8888);
	 logger.write("Server has started.");
}

exports.start = start;