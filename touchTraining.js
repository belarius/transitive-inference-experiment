// Transitive Inference Task for use with Humans and Non-Human Primates
// client-side
// Brendon Villalobos

// gather preliminary data from server-side 
// (which pictures to use and subject id)
var dataHttp = new XMLHttpRequest();
dataHttp.open("GET", "info.dat", false);
dataHttp.send();
dataList = dataHttp.responseText.split(",");

var w = window.innerWidth;
var h = window.innerHeight;

// assign information to pictures A through E
A = {filepath: "pics/red.spc", id: dataList[2], rank: 0, correct: true};


subject_id = dataList[0];
picture_array = [A];
trial_number = Array();
session_length = 0;
for(i=0;i<10;i++){
  session_length = session_length + 1;
  trial_number.push(session_length.toString());
}

// data collection arrays
var trial_objects = Array();
var trial_result = Array.apply(null, new Array(session_length)).map(String.prototype.valueOf,"");
var stim_time = Array.apply(null, new Array(session_length)).map(String.prototype.valueOf,"");
var result_time = Array.apply(null, new Array(session_length)).map(String.prototype.valueOf,"");
var result_x = Array.apply(null, new Array(session_length)).map(String.prototype.valueOf,"");
var result_y = Array.apply(null, new Array(session_length)).map(String.prototype.valueOf,"");
var trial_timeouts = Array.apply(null, new Array(session_length)).map(String.prototype.valueOf,"0");
var timeout_time = Array.apply(null, new Array(session_length)).map(String.prototype.valueOf,"0");
var interTrial_timeouts = Array.apply(null, new Array(session_length)).map(String.prototype.valueOf,"0");
var id_array = Array.apply(null, new Array(session_length)).map(String.prototype.valueOf,subject_id);
var current_trial = -1;
var penaltyDelay = 0;
var delay = 0;
var feedback_delay = 1500;

console.log(trial_number);
console.log(id_array);
console.log(trial_timeouts)

// keyboard event listener

var keypressing = false;
//document.addEventListener('keydown', alert('Hello world!'), false);
document.addEventListener('keyup', function(ev) {return onkey(ev, ev.keyCode, false); }, false);

// put images in document body
newTrial()


// runs through a single trial, picking a pair of images
function newTrial(retry){
  w = window.innerWidth;
  h = window.innerHeight;
  current_trial = current_trial + 1;
  console.log(trial_objects);
  var stimulus_one = createStimulus(picture_array[0], 0.5 + Math.random()*0.5 - 0.25, 0.5 + Math.random()*0.5 - 0.25);
}

function checkClicked(source){
  var selection = document.getElementsByTagName('img');
  if(selection.length > 1 && (selection[0].src == source || selection[1].src == source)){
    if(selection[0].class === "unclicked" && selection[1].class === "unclicked"){
      selection[0].click();
    }
  }
}

function onkey(ev, key, pressed){
  switch(key){
    case 32:
      trial_result[current_trial] = "2";
      console.log(trial_result);
      resetVars(false);
      delay = 0;
      presentInterTrial();
      ev.preventDefault();
      break;
  }
}

// creates the stimulus
function createStimulus(image_object, relX, relY){
  var stimulus = document.createElement('img');
  stimulus.id = image_object.id;
  stimulus.src = image_object.filepath + new Date().getTime();
  stimulus.width = 350;
  stimulus.height = 350;
  stimulus.style.left = (Math.floor(w*relX) - Math.floor(0.5*stimulus.width)) + "px";
  stimulus.style.top = (Math.floor(h*relY) - Math.floor(0.5*stimulus.height)) + "px";
  stimulus.style.position = "absolute";
  stimulus.class = "unclicked";
  document.body.appendChild(stimulus);
  stim_time[current_trial] = new Date().getTime();
  var creation_time = new Date().getTime();
  // once image is clicked, experiment result is recorded and next trial starts
  stimulus.addEventListener('touchstart', function(e){
    getCoords(e, current_trial);
    var event_time = new Date().getTime();
    result_time[current_trial] = event_time;
    image_object.class = "clicked";
    giveResult(image_object, true);
  });
  stimulus.addEventListener('mousedown', function(e){
    getCoords(e, current_trial);
    var event_time = new Date().getTime();
    result_time[current_trial] = event_time;
    image_object.class = "clicked";
    giveResult(image_object, true);
  });
return stimulus;
}



// records experiment, instigates new trial
function giveResult(image, action_taken){
  var stimulus = document.getElementById(image.id);
  
  if(action_taken){
    // if participant selects correct image
    if(image.correct){
      trial_result[current_trial] = "1";
      console.log(trial_result);
      resetVars(false);
      delay = 0;
      presentInterTrial();
    }
    // incorrect image
    else {
      trial_result[current_trial] = "0";
      console.log(trial_result);
      resetVars(false);
      delay = penaltyDelay;
      presentInterTrial();
    }
  }
  else{
    timeout_time[current_trial] = new Date().getTime();
    trial_result[current_trial] = "-1";
    console.log(trial_result);
    resetVars(false);
    delay = 0;
    presentInterTrial(true);
  }
}

// present image to re-orientate participant
function presentInterTrial(timeout){
  if(typeof timeout == 'undefined'){
    var interImg = document.createElement('img');
    interImg.width = 200;
    interImg.height = 200;
    interImg.style.left = (Math.floor(w/2) - Math.floor(0.5*interImg.width)) + "px";
    interImg.style.top = (Math.floor(h/2) - Math.floor(0.5*interImg.height)) + "px";
    interImg.style.position = "absolute";
    if(trial_result[current_trial] === "0"){
      interImg.src = "pics/ex.spc" + new Date().getTime();
    }
    else if (trial_result[current_trial] == "1"){
      interImg.src = "pics/check.spc" + new Date().getTime();
    }
    document.body.appendChild(interImg);
    setTimeout(function(){
      resetVars(true)
    }, feedback_delay);
  }
  else if (timeout){
    resetVars(true)
  }
}

// clears html document of image objects
function resetVars(newTrialBool){
  var selection = document.getElementsByTagName('img');
  for(i=0;i <= selection.length;i++){
    selection[0].parentNode.removeChild(selection[0]);
  }
  picture_array[0].correct = true;
  picture_array[0].class = "unclicked";
  if(newTrialBool){
    // wait a second for next trial
    newTrial();
  }
}

function printToServer(){
  print_string = "";
  var xmlhttp = new XMLHttpRequest();
  for(i=0; i<session_length; i++){
    print_string += id_array[i] + ",";
    print_string += trial_number[i] + ",";
    print_string += trial_result[i] + ",";
    print_string += stim_time[i] + ",";
    print_string += result_time[i] + ",";
    print_string += result_x[i] + ",";
    print_string += result_y[i] + ",";
    print_string += trial_timeouts[i] + ",";
    print_string += timeout_time[i] + ",";
    print_string += interTrial_timeouts[i] + ",";
    print_string += trial_objects[i][0].rank + ",";
    print_string += trial_objects[i][0].id + ",";
    print_string += trial_objects[i][1].rank + ",";
    print_string += trial_objects[i][1].id;
    print_string += ";";
    console.log(print_string);
    xmlhttp.open("POST", print_string + ".sav" ,true);
  }
  xmlhttp.send();
  }

function getCoords(e, current_trial){
    var cursorX = e.clientX;
    var cursorY = e.clientY;
    result_x[current_trial] = cursorX; 
    result_y[current_trial] = cursorY;
}