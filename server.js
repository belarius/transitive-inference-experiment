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
var folder = "trialData";
var outputFile = folder + "/" + strainID + "-" + subjectID + "-" + makeDate() + ".csv";
var pictureFolder = "./pics"; // hardcoded destination for the data files
console.log("Randomization: " + random);
console.log("Starting web server at " + serverUrl + ":" + port);
var fileList = fs.readdirSync(pictureFolder);
if(random){
  fileList = shuffle(fileList);
}

var ImageBank = new ImageList();
ImageBank.getPicsFromFile(fileList);

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
        console.log(filename)
        picArray = ImageBank.requestList(Number(filename.substring(9,13)),Number(filename.substring(6,8)),Number(filename.substring(1,5)));
        console.log("Serving list " + Number(filename.substring(9,13)) + ", of length " + Number(filename.substring(6,8)) + " and type " + Number(filename.substring(1,5)));
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
	var pulseDuration = 200;
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

function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}

// ImageList Object
function ImageList(){
  var IL_list_id     = Array();
  var IL_list_files  = Array();
  var IL_list_length = Array();
  var IL_list_type   = Array();
  var count = 0;  
  
  this.getPicsFromFile = function(fileList){
    var IL_picArray    = Array();
    while(fileList.length > 0){
      if(path.extname(fileList[0]) == ".png" && fileList[0].substring(0,1) != "."){
        IL_picArray.push(fileList[0]);
      }
      fileList.shift();
    }
    while(IL_picArray.length > 0) {
      IL_list_id.push(IL_picArray[0].substr(0, 12));
      IL_list_length.push(Number(IL_picArray[0].substr(5, 2)));
      IL_list_type.push(Number(IL_picArray[0].substr(0, 4)));
      IL_list_files.push(Array());
      while( (IL_picArray.length > 0) && (IL_list_id[IL_list_id.length-1] === IL_picArray[0].substr(0, 12))){
        IL_list_files[IL_list_files.length-1].push(IL_picArray[0]);
        IL_picArray.shift();
      }
    }
  }
  
  this.requestList = function(rq_list,rq_len,rq_type){
    search_id = zeroPad(rq_type,4) + "-" + zeroPad(rq_len,2) + "-" + zeroPad(rq_list,4);
    search_result = IL_list_id.indexOf(search_id);
    return IL_list_files[search_result];
  }

}


