// Transitive Inference Task
// server-side
// Brendon Villalobos

var dataHeader = "subject_id,trial,correct_response,stim_time,response_time,x_coord,y_coord,trial_timeout,timeout_time,interTrial_timeout,left_rank,right_rank,distance,joint_rank,left_image,right_image\n";
var port = 8000;
var serverUrl = "127.0.0.1"; 
var app = require('express');
var http = require("http");
var path = require("path"); 
var fs = require("fs");
var args = process.argv.slice(2);
var random = false;
var cntrl = "none";
var strainID, subjectID, picArray, needNew;
validation();
var outputFile;
var folder = "trialData";
var pictureFolder = "./pics"; // hardcoded destination for the data files
console.log("Randomization: " + random);
console.log("Starting web server at " + serverUrl + ":" + port);
var fileList = fs.readdirSync(pictureFolder);
if(random){
  fileList = shuffle(fileList);
}

function newList(){
  picArray = Array();
  outputFile = folder + "/" + strainID + "-" + subjectID + "-" + makeDate() + ".csv"
  while(picArray.length < 5){
    if(fileList.length == 0){
      console.log("Picture file exhausted. Reinitiate server.");
      process.exit();
    }
    if(path.extname(fileList[fileList.length-1]) == ".png" && fileList[fileList.length-1].substring(0,1) != "."){
      picArray.push(fileList[fileList.length-1]);
	    console.log("Added picture: " + fileList[fileList.length-1]);
    }
    fileList.pop();
  }
  picArray.reverse();
}

newList();
fs.writeFile(outputFile, dataHeader, function (err) {
  if (err){
    return console.log(err);
  } else{
    console.log("Creating data file");
  }
});

var server = http.createServer( function(req, res) {
  var now = new Date();
  var filename = req.url || "index.html";
  var ext = path.extname(filename);
  var localPath = __dirname;
  var validExtensions = {
    ".html": "text/html",          
    ".js": "application/javascript", 
    ".php": "application/php",
    ".css": "text/css",
    ".txt": "text/plain",
    ".jpg": "image/jpeg",
    ".gif": "image/gif",
    ".png": "image/png",
    ".ico": "image/ico",
    ".sav": "text/sav",
    ".dat": "text/data",
    ".spc": "image/special",
    ".wav": "sound",
    ".ogg": "sound",
    ".rwd": "reward delivery command"
  };
  var isValidExt = validExtensions[ext];

  if (isValidExt) {
    localPath += filename;
    fs.exists(localPath, function(exists) {
      if(exists) {
        console.log("Serving file: " + localPath);
        getFile(localPath, res, ext); 
      }
      else if(path.extname(filename) === ".rwd"){
      	if(cntrl == "arduino"){
	        goArduino();
	    }
        var toSend = "trash.jpg";
        res.end(toSend);
      }
      else if(path.extname(filename) === ".sav"){
        console.log("Recording trial");
        fs.appendFile(outputFile, parseData(filename), function (err) { if (err){ return console.log(err); } });
        var toSend = "done";
        res.end(toSend);
      }
      else if(path.extname(filename) === ".dat"){
        var toSend = [subjectID, random, picArray].toString();
        res.end(toSend);
      }
      else if(path.extname(filename) === ".wav" || path.extname(filename) === ".ogg"){
        console.log("Serving file: " + localPath);
        getFile(localPath, res, ext); 
      }
      else if(path.extname(filename) !== ".sav" && !isNaN(filename.substring(6,7))){
        getFile(pictureFolder +"/" + picArray[parseInt(filename.substring(6,7))], res, ext);
        console.log("Serving file: " + filename);
      }
      else {
        console.log("File not found: " + localPath);
        res.writeHead(404);
        res.end();
      }
    }); 
  }
  else {
    console.log("File not found: " + filename);
  }
  if(needNew){
    newList();
  }
}).listen(port, serverUrl);

function parseData(data){
  data = data.substring(1, data.length - 4);
  data = data.split(";").join("\n");
  return data;
}

function getFile(localPath, res, mimeType) {
  fs.readFile(localPath, function(err, contents) {
    if(!err) {
      res.setHeader("Content-Length", contents.length);
      res.setHeader("Content-Type", mimeType);
      res.statusCode = 200;
      res.end(contents);
    } else {
      res.writeHead(500);
      res.end();
    }
  });
}

function usage(){
  console.log("server.js usage:");
  console.log("node server.js [strain_id] [subject_id] [fixed/random] [arduino/none]");
  console.log("Starts server for TI task with subject");
}

function validation(){
  if(!(args.length == 2 || args.length == 3 || args.length == 4)){
    console.log(args.length);
    console.log("Error: incorrect number of parameters");
    usage();
    process.exit();
  }
  else if(args[0].length != 4){
    console.log("Error: Strain ID is not 4 characters");
    process.exit();
  }
  else if(args[1].length != 8){
    console.log("Error: Subject ID is not 8 characters");
    process.exit();
  }
  if(args[2] !== undefined && args[2] != "random" && args[2] != "fixed"){
    console.log("Third parameter must equal \'fixed\' or \'random\'");
    process.exit();
  }
  else if(args[2] == "random"){
    random = true;
  }
  if(args[3] !== undefined && args[3] != "none" && args[3] != "arduino"){
    console.log("Fourth parameter must equal \'none\' or \'arduino\'");
    process.exit();
  }
  else {
    cntrl = args[3];
  }
  
  strainID = args[0];
  console.log("Species Strain ID: " + args[0]);
  subjectID = args[1];
  console.log("Subject ID: " + args[1]);
}

function makeDate(){
  fileDate = new Date();
    // add year
    returnString = fileDate.getFullYear().toString();
    // add month
    if((fileDate.getMonth() + 1).toString().length != 2){
      returnString = returnString + "-0" + (fileDate.getMonth() + 1).toString();
    }
    else{
      returnString = returnString + "-" + (fileDate.getMonth() + 1).toString();
    }
    // add date
    if(fileDate.getDate().toString().length != 2){
      returnString = returnString + "-0" + fileDate.getDate().toString();
    }
    else{
      returnString = returnString + "-" + fileDate.getDate().toString();
    }
    // add hours
    if(fileDate.getHours().toString().length != 2){
      returnString = returnString + "-0" + fileDate.getHours().toString();
    }
    else{
      returnString = returnString + "-" + fileDate.getHours().toString();
    }
    // add minutes
    if(fileDate.getMinutes().toString().length != 2){
      returnString = returnString + "0" + fileDate.getMinutes().toString();
    }
    else{
      returnString = returnString + fileDate.getMinutes().toString();
    }
    console.log("Timestamp: " + returnString);

    return returnString; 
  }

// Shuffle Algorithm used from Jonas Raoni Soares Silva @ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ 
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
};

// johnny-five/Arduino related code follows:
if(cntrl == "arduino"){
	var j5 = require("johnny-five");
	var board = new j5.Board();
	var LEDPIN = 13;
	var OUTPUT = 1;
	var val = 0;
	var pulseDuration = 150;
	board.on("ready", function(){
	  // Set pin 13 to OUTPUT mode
	  this.pinMode(LEDPIN, OUTPUT);
	});
}

function goArduino(){
  if(board){
    board.digitalWrite(LEDPIN, 1);
    setTimeout(function(){board.digitalWrite(LEDPIN, 0)}, pulseDuration);
  }
}
