var logger = require("./logger");

function route(handle, pathname, response, request) 
{
	logger.write("About to route a request for " + pathname);
	if ( pathname.indexOf('.css') != -1)
	{
		handle[".css"](response, request,pathname);
	}
	else if ( pathname.indexOf('.png') != -1)
	{
		handle[".png"](response, request,pathname);
	}
	else if ( pathname === "/download")
	{
		handle["/download"](response, request,true);
	}
	else if (typeof handle[pathname] === 'function') 
	{
		handle[pathname](response, request);
	} 
	else 
	{
		logger.write("ERROR - No request handler found for " + pathname);
		response.writeHead(404, {"Content-Type": "text/plain"});
		response.write("404 Not found");
		response.end();
	}
}

exports.route = route;