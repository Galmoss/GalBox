var querystring = require("querystring"),
	formidable = require("formidable"),
	util = require('util'),
    fs   = require('fs-extra'),
	path = require("path"),
	url = require("url"),
	env = require('jsdom').env,
	mime = require('mime');
	
var db = require("./database");
var logger = require("./logger");

function start(response, request) 
{
	logger.write("Request handler 'start' was called");
	openFile(response, request, '/html/index.html','text/html');
}

function login(response, request) 
{
	logger.write("Request handler 'login' was called ");

	var username = "";
	var password = "";
	
	var form = new formidable.IncomingForm();
	logger.write("about to parse login form");
	
	//parse the login form for username & password
	form.parse(request, 
		function(err, fields, files) 
		{
			logger.write('received username & password:' + util.inspect({fields: fields}));
			username = fields.username;
			password = fields.password;

		});

	form.on('error', 
		function(err) 
		{
			logger.write(err);
			openHtmlWithError(response, request, './html/index.html', '#error_message', "Wrong Username/Password");
		}
	);
	
	form.on('end', 
		function(fields, files) 
		{
			//
			db.validatePassword(username,password,
				function(error,valid)
				{
					if(error || !valid)
					{
						logger.write("ERROR: "+error);
						openHtmlWithError(response, request, './html/index.html', '#error_message', error);
					}
					else
					{
						logger.write("validation was successful")
						redirectResponse(response, './folder?username='+username);
					}
					
				}
			);
	
		}
	);
}

function signup(response, request) 
{
	logger.write("Request handler 'signup' was called");
	
	openFile(response, request, '/html/register.html','text/html');
}

function registerUser(response, request) 
{
	logger.write("Request handler 'registerUser' was called");
	
	var username = "";
	var password = "";
	
	var form = new formidable.IncomingForm();
	logger.write("about to parse register form");
	
	form.parse(request, 
		function(err, fields, files) 
		{
			logger.write('received username & password:' + util.inspect({fields: fields}));
			username = fields.username;
			password = fields.password;
	
		});

	form.on('error', 
		function(err) 
		{
			logger.write(err);
			openHtmlWithError(response, request, './html/register.html', '#error_message', "Error - try again");
		}
	);
	
	
	form.on('end', 
		function(fields, files) 
		{	
			db.checkUserExists(username,
				function(error,passed)
				{
					if(error || !passed)
					{
						logger.write("ERROR: "+error);
						openHtmlWithError(response, request, './html/register.html', '#error_message', error);
					}
					else
					{
						db.insertNewUser(username,password,
							function(error)
							{
								if(error)
								{
									logger.write("ERROR: "+error);
									openHtmlWithError(response, request, './html/register.html', '#error_message', error);
								}
							
							}
						);
						logger.write("Registration was successful");
						//open index with success message
						openHtmlWithError(response, request, './html/index.html', '#success_message', 'Registered Successfully');
					}
					
				}
			);
	
		}
	);
}

function folder(response, request) 
{
	logger.write("Request handler 'folder' was called");
	
	var tableRowsStr = "";
	var uploadFormStr = "";
	var filesArray = [];
	var username = url.parse(request.url, true).query.username;
	var emptyFolderStr = "<tr> <td align=\"center\">You haven't uploaded nothing... yet</tr> </td>";
	
	if(!fs.existsSync("./tmp/"+username+"/"))
		tableRowsStr = emptyFolderStr;
	else{
		fs.readdir("./tmp/"+username+"/", 
			function (error, files) 
			{
				if (error)
				{					
					logger.write(error);
					return;
				}
				
				if(files.length == 0)
					tableRowsStr = emptyFolderStr;
					
				files.map(function (file) {
					return path.join("./tmp/"+username+"/", file);
				}).filter(function (file) {
					return fs.statSync(file).isFile();
				}).forEach(function (file) {
					tableRowsStr += buildTableRowsStr(file,username);
				});
			}
		);
	}
	
	uploadFormStr += buildUploadFormStr(username);
	
	env('./html/folder.html', 
		function (errors, window) 
		{
			var $ = require('jquery')(window);
			$('#folder_header').html(username);
			$('#files_table').html(tableRowsStr);
			$('#upload_form').html(uploadFormStr);
			response.write($("html")[0].outerHTML);
			response.end();
		}
	);
}

function buildTableRowsStr(file,username)
{
	return '<tr> <td>'+ path.basename(file) +'</td>'
			+'<td align="right" style="width:32px;height:32px;border:0;"><a href="viewFile?file_path='+ file 
			+ '" target="_blank"><img src="./images/view.png"></a></td>'
			+'<td align="right" style="width:32px;height:32px;border:0;"><a href="download?file_path='+ file 
			+ '" ><img src="./images/download.png"></a></td>'
			+'<td align="right" style="width:32px;height:32px;border:0;"><a href="deleteFile?file_path='+ file 
			+ '&user_name='+username+'" ><img src="./images/delete.png"  ></a></td></tr>';
}

function buildUploadFormStr(username)
{
	return '<input type="hidden" name="username" value="'+username+'" />'
			+'<input type="file" value="Upload File" id="upload_button" name="upload" multiple="multiple" required/><br><br>'
			+'<input type="submit" value="Upload" />';
}

function getFile(response, request, shouldDownload)
{
	logger.write("Request handler 'getFile' was called.");

	var contentDisposition = 'inline';
	var file = __dirname + "\\" + url.parse(request.url, true).query.file_path;
	var filename = path.basename(file);
	var mimetype = mime.lookup(file);
	
	if(shouldDownload)
		contentDisposition = 'attachment';
		
	response.setHeader('Content-disposition', contentDisposition+'; filename=' + filename);
	response.setHeader('Content-type', mimetype);

	rs = fs.createReadStream(file);
	rs.pipe(response);
}

function deleteFile(response, request) 
{
	logger.write("Request handler 'download' was called.");
	
	var file = __dirname + "\\" + url.parse(request.url, true).query.file_path;
	var username = url.parse(request.url, true).query.user_name;
	
	fs.unlinkSync(file);
	//refresh page after the delete is over
	redirectResponse(response, './folder?username='+username);
}

function upload(response, request) 
{
	logger.write("Request handler 'upload' was called.");

	var username = "";
	var form = new formidable.IncomingForm();

	logger.write("about to parse");

	//getting the username from the upload form
	form.parse(request, 
		function(err, fields, files) 
		{
			logger.write('received upload:' + util.inspect({fields: fields, files: files}));
			username = fields.username;

		});

	//printing the completed upload percentage into the log
	form.on('progress', 
		function(bytesReceived, bytesExpected) 
		{
			var percent_complete = (bytesReceived / bytesExpected) * 100;
			logger.write("File upload percent: " + percent_complete.toFixed(2));
		}
	);

	form.on('error', 
		function(err) 
		{
			logger.write(err);
		}
	);
	//when finish handling the form
	form.on('end', 
		function(fields, files) 
		{
			/* Temporary location of our uploaded file */
			var temp_path = this.openedFiles[0].path;
			/* The file name of the uploaded file */
			var file_name = this.openedFiles[0].name;
			/* Location where we want to copy the uploaded file */
			var new_location = './tmp/' + username + "/"+ file_name;

			//copying the file into new_location
			fs.copy(temp_path, new_location, 
			function(err) 
				{  
					if (err) 
					{
						logger.write(err);
					} 
					else 
					{
						logger.write("File uploaded successfully");
						//if uploaded successfully refresh folder page
						redirectResponse(response, './folder?username='+username);
					}
				}
			);
		}
	);

}

//for opening all the html pages css files
function getCss(response, request, pathname)
{
	logger.write("Request handler 'getCss' was called");

	openFile(response, request, pathname,'text/css');

}

//for opening all png icons 
function getPng(response, request, pathname)
{
	logger.write("Request handler 'getCss' was called");
	
	openFile(response, request, pathname,'image/png');
}

//open input pathname file in the http response
function openFile(response, request, pathname,contentTypeStr)
{
	fs.readFile('.'+pathname, 
		function (error, data) 
		{
			if (error) 
			{
				logger.write("ERROR: "+error);
			}
			response.writeHead(200, {'Content-Type': contentTypeStr});
			response.write(data);
			response.end();
		});
}

//injecting errorStr into tagId in pathname html
function openHtmlWithError(response, request, pathname, tagId, errorStr)
{
	env(pathname, 
		function (errors, window) 
		{
			var $ = require('jquery')(window);
			$(tagId).html(errorStr);
			response.write($("html")[0].outerHTML);
			response.end();
		}
	);
}

function redirectResponse(response, locationStr)
{
	response.writeHead(301,{Location: locationStr});
	response.end();
}

exports.start = start;
exports.login = login;
exports.signup = signup;
exports.registerUser = registerUser;
exports.folder = folder;
exports.getFile = getFile;
exports.upload = upload;
exports.deleteFile = deleteFile;
exports.getCss = getCss;
exports.getPng = getPng;
