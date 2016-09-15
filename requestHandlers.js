var querystring = require("querystring"),
	formidable = require("formidable"),
	util = require('util'),
    fs   = require('fs-extra'),
	path = require("path"),
	url = require("url"),
	env = require('jsdom').env,
	mime = require('mime');

var logger = require("./logger");

function start(response) 
{
	logger.write("Request handler 'start' was called");
	
	fs.readFile('./start.html', 
		function (err, html) {
			if (err) 
			{
				throw err; 
			}  		
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write(html);
			response.end();
		});
}

 function upload(response, request) 
 {
	logger.write("Request handler 'upload' was called.");
	
	var username = "";
	var form = new formidable.IncomingForm();
	
	logger.write("about to parse");
	
	form.parse(request, 
		function(err, fields, files) 
		{
			logger.write('received upload:' + util.inspect({fields: fields, files: files}));
			username = fields.username;

		});
	
	form.on('progress', function(bytesReceived, bytesExpected) {
        var percent_complete = (bytesReceived / bytesExpected) * 100;
        logger.write("File upload percent: " + percent_complete.toFixed(2));
    });
 
    form.on('error', function(err) {
        logger.write(err);
    });
	
	form.on('end', function(fields, files) {
        /* Temporary location of our uploaded file */
        var temp_path = this.openedFiles[0].path;
        /* The file name of the uploaded file */
        var file_name = this.openedFiles[0].name;
        /* Location where we want to copy the uploaded file */
        var new_location = './tmp/' + username + "/";
 
        fs.copy(temp_path, new_location + file_name, function(err) {  
            if (err) {
                logger.write(err);
            } else {
                logger.write("success!")
				response.writeHead(301,{Location: './start'});
				response.end();
            }
        });
    });

 }
 
function getUserName(response, request) 
{
	
	logger.write("Request handler 'getUserName' was called ");
	
	fs.readFile('./folder.html', 
		function (err, html) {
			if (err) 
			{
				throw err; 
			}  		
			response.writeHead(200, {"Content-Type": "text/html"});
			response.write(html);
			response.end();
		});
	
}
 
function listFolder(response, request) 
{
	logger.write("Request handler 'listFolder' was called ");

	var username = "";
	var tableRowsStr = "";
	var filesArray = [];
	var form = new formidable.IncomingForm();
	logger.write("about to parse");
	
	form.parse(request, 
		function(err, fields, files) 
		{
			logger.write('received username:' + util.inspect({fields: fields}));
			username = fields.username;

		});

	form.on('error', 
		function(err) 
		{
			logger.write(err);
		}
	);
	
	
	form.on('end', 
		function(fields, files) 
		{
				
			//to get the list of file into the array
			fs.readdir("./tmp/"+username+"/", 
				function (error, files) 
				{
					if (error)
					{					
						logger.write(error);
						return;
					}
										
					files.map(function (file) {
						return path.join("./tmp/"+username+"/", file);
					}).filter(function (file) {
						return fs.statSync(file).isFile();
					}).forEach(function (file) {
						tableRowsStr += "<tr> <td> <a href=\"download?file_path="+ file + "\">"+ path.basename(file) +"</a></td></tr>";
					});
				}
			);
			
			env('./user_folder.html', 
				function (errors, window) 
				{
					var $ = require('jquery')(window);
					$('#folder_header').html(username);
					$('#files_table').html(tableRowsStr);
					response.write($("html")[0].outerHTML);
					response.end();
				}
			);
		}
	);
}
 
function download(response, request) 
{
	logger.write("Request handler 'download' was called.");
	
	var file = __dirname + "\\" + url.parse(request.url, true).query.file_path;

	var filename = path.basename(file);
	var mimetype = mime.lookup(file);

	response.setHeader('Content-disposition', 'attachment; filename=' + filename);
	response.setHeader('Content-type', mimetype);

	rs = fs.createReadStream(file);
	rs.pipe(response);

}

function getCss(response, request, pathname)
{
	logger.write("Request handler 'getCss' was called");

	fs.readFile('.'+pathname, 
		function (error, data) 
		{
			if (error) 
			{
				logger.write("ERROR: "+error);
			}
			response.writeHead(200, {'Content-Type': 'text/css'});
			response.write(data);
			response.end();
		});
}

exports.start = start;
exports.upload = upload;
exports.download = download; 
exports.getCss = getCss;
exports.getUserName = getUserName;
exports.listFolder = listFolder;