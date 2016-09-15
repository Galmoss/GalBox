var server = require("./server"),
	router = require("./router"),
	requestHandlers = require("./requestHandlers"),
	db = require("./database"),
    fs = require('fs-extra');

var handle = {};
handle["/"] = requestHandlers.start;
handle["/index"] = requestHandlers.start;
handle["/login"] = requestHandlers.login;
handle["/folder"] = requestHandlers.folder;
handle["/signup"] = requestHandlers.signup;
handle["/registerUser"] = requestHandlers.registerUser;
handle["/upload"] = requestHandlers.upload;
handle["/download"] = requestHandlers.getFile;
handle["/viewFile"] = requestHandlers.getFile;
handle["/deleteFile"] = requestHandlers.deleteFile;
handle[".css"] = requestHandlers.getCss;
handle[".png"] = requestHandlers.getPng;

//if DB not exists - create one
if( !fs.existsSync("galbox.db") )
	db.create();
server.start(router.route, handle);