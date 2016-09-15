var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");

var handle = {};
handle["/"] = requestHandlers.start;
handle["/start"] = requestHandlers.start;
handle["/upload"] = requestHandlers.upload;
handle["/download"] = requestHandlers.download;
handle["/folder"] = requestHandlers.getUserName;
handle["/user_folder"] = requestHandlers.listFolder;
handle[".css"] = requestHandlers.getCss;

server.start(router.route, handle);