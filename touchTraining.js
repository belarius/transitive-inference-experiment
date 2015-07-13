// Touch Training Task for use with Non-Human Primates
// client-side
// Brendon Villalobos

// ============================
// ====VARIABLE DECLARATION====
// ============================

// ====Task Variables====
var timeoutInterval = 10000;
var penaltyDelay = 0;
var delay = 0;
var feedback_delay = 700;

// ====Operational Variables====
var w = window.innerWidth;
var h = window.innerHeight;
var dataHttp = new XMLHttpRequest();
var keypressing = false;

// ====Timers====
var responseTimer = 0;
var penaltyTimer = 0;
var rewardDeliveryTimer = 0;
var interTrialTimer = 0;
var cycleTimer = 0;

// ===========================
// ====TASK INITIALIZATION====
// ===========================

pth = "pics/red.spc";
A = {filepath: pth, id: "red", rank: 1, correct: true};
var picture_array = Array();
picture_array.push(A);
document.addEventListener('keyup', function(ev) {return onkey(ev, ev.keyCode, false); }, false);

// ====Begin Task====
newTrial();

// =================
// ====FUNCTIONS====
// =================

// ====Task Functions====

function resetVars(newTrialBool){
  // clears html document of image objects
  var selection = document.getElementsByTagName('img');
  for(i=0;i <= selection.length;i++){
    selection[0].parentNode.removeChild(selection[0]);
  }
  clearTimeout(responseTimer);
  clearTimeout(penaltyTimer);
  clearTimeout(rewardDeliveryTimer);
  clearTimeout(interTrialTimer);
  if(newTrialBool){
    newTrial();
  }
}

function newTrial(){
  // runs through a single trial, picking a pair of images
  w = window.innerWidth;
  h = window.innerHeight;

  // create stimuli
  var stimulus = createStimulus(picture_array[0], 0.5 + Math.random()*0.5 - 0.25, 0.5 + Math.random()*0.5 - 0.25);
}

function createStimulus(image_object, relX, relY){
  // creates the stimulus
  var stimulus = document.createElement('img');
  stimulus.id = image_object.id;
  stimulus.src = image_object.filepath;// + new Date().getTime();
  stimulus.width = 350;
  stimulus.height = 350;
  stimulus.style.left = (Math.floor(w*relX) - Math.floor(0.5*stimulus.width)) + "px";
  stimulus.style.top = (Math.floor(h*relY) - Math.floor(0.5*stimulus.height)) + "px";
  stimulus.style.position = "absolute";
  stimulus.class = "unclicked";
  document.body.appendChild(stimulus);
  var creation_time = new Date().getTime();
  // once image is clicked, experiment result is recorded and next trial starts
  stimulus.addEventListener('touchstart', function(e){ stimTouched(e, image_object, true) });
  stimulus.addEventListener('mousedown', function(e){ stimTouched(e, image_object, false) });
  return stimulus;
}

function stimTouched(e, image_object, is_touch){
  if(is_touch){
    getTouchCoords(e);
  } else {
    getMouseCoords(e);
  }
  image_object.class = "clicked";
  giveResult(image_object, true);
  clearTimeout(responseTimer);
}

function giveResult(image, action_taken){
  // records experiment, instigates new trial
  var stimulus = document.getElementById(image.id);
  if(action_taken){
    var interImg = document.createElement('img');
    interImg.width = 200;
    interImg.height = 200;
    interImg.style.left = (Math.floor(w/2) - Math.floor(0.5*interImg.width)) + "px";
    interImg.style.top = (Math.floor(h/2) - Math.floor(0.5*interImg.height)) + "px";
    interImg.style.position = "absolute";
    if(image.correct){
      // if participant selects correct image
      console.log("Correct");
      delay = 0;
      interImg.src = "pics/check.spc";// + new Date().getTime();

      window.setTimeout(function(){
        dataHttp.open("GET", Math.random() + ".rwd", true);
        dataHttp.send();
      }, 500);
      window.setTimeout(function(){
        dataHttp.open("GET", Math.random() + ".rwd", true);
        dataHttp.send();
      }, 800);
            window.setTimeout(function(){
        dataHttp.open("GET", Math.random() + ".rwd", true);
        dataHttp.send();
      }, 1100);
     
	  var confirmed = dataHttp.responseText;
    }
    // incorrect image
    else {
      interImg.src = "pics/ex.spc";// + new Date().getTime();
      console.log("Incorrect");
      delay = penaltyDelay;
    }
    resetVars(false);
    document.body.appendChild(interImg);
    endAndStartTimer(rewardDeliveryTimer, feedback_delay, function(){
      resetVars(true)
    });
  }
  else{
    console.log("Timeout");
    printToServer(current_trial);
    resetVars(true);
    delay = 0;
  }
}

// ====Operational Functions====

function checkClicked(source){
  var selection = document.getElementsByTagName('img');
  if(selection.length > 1 && (selection[0].src == source || selection[1].src == source)){
    if(selection[0].class === "unclicked" && selection[1].class === "unclicked"){
      selection[0].click();
    }
  }
}

function endAndStartTimer(id, interval, fun){
  window.clearTimeout(id)
  id = window.setTimeout(fun, interval)
}

function getTouchCoords(e){
  var touchobj = e.changedTouches[0];
  var cursorX = parseInt(touchobj.clientX);
  var cursorY = parseInt(touchobj.clientY);
//  document.getElementById("XY").innerHTML = cursorX + " , " + cursorY;
}

function getMouseCoords(e){
  var cursorX = parseInt(e.clientX);
  var cursorY = parseInt(e.clientY);
//  document.getElementById("XY").innerHTML = cursorX + " , " + cursorY;
}

function onkey(ev, key, pressed){
  switch(key){
    case 32:
      console.log("Keyboard reward");
      delay = 0;
      var dummy = picture_array[0];
      giveResult(dummy, true);
      ev.preventDefault();
      break;
  }
}

function shuffle(o){ 
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function printToServer(trial_id){
  // Passes information from a single trial to the server
  print_string = "";
  var xmlhttp = new XMLHttpRequest();
  print_string += id_array[trial_id] + ",";
  print_string += trial_number[trial_id] + ",";
  print_string += trial_result[trial_id] + ",";
  print_string += stim_time[trial_id] + ",";
  print_string += result_time[trial_id] + ",";
  print_string += result_x[trial_id] + ",";
  print_string += result_y[trial_id] + ",";
  print_string += trial_timeouts[trial_id] + ",";
  print_string += timeout_time[trial_id] + ",";
  print_string += interTrial_timeouts[trial_id] + ",";
  print_string += trial_objects[trial_id][0].rank + ",";
  print_string += trial_objects[trial_id][1].rank + ",";
  print_string += Math.abs(trial_objects[trial_id][0].rank - trial_objects[trial_id][1].rank) + ",";
  print_string += trial_objects[trial_id][0].rank + trial_objects[trial_id][1].rank + ",";
  print_string += trial_objects[trial_id][0].id + ",";
  print_string += trial_objects[trial_id][1].id;
  print_string += ";";
  xmlhttp.open("GET", print_string + ".sav" ,true);
  xmlhttp.send();
  var confirmed = xmlhttp.responseText;
}                                                    