// Transitive Inference Task for use with Humans and Non-Human Primates
// client-side
// Brendon Villalobos

// ============================
// ====VARIABLE DECLARATION====
// ============================

// ====Task Variables====
var century = 4;
var listLength = 5;
var listType = 0;
var blockCount = 100;
var trialCountCap = 2000;
var timeoutInterval = 10000;
var penaltyDelay = 0;
var delay = 0;
var feedback_delay = 500;
var pulseNumber = 1;
var presentPosition = 0;

// ====Operational Variables====
var w = window.innerWidth;
var h = window.innerHeight;
var current_trial = -1;
var dataHttp = new XMLHttpRequest();
var category_array = Array();
var delay_array = Array();
var picture_array = Array();
var listRequest = Array();

// ====Data Collection Arrays====
var trial_number = Array();
var trial_objects = Array();
var trial_result = Array();
var stim_time = Array();
var result_time = Array();
var result_x = Array();
var result_y = Array();
var list_position = Array();
var response_made = Array();
var id_array = Array();
var session_length = 0;

// ====Timers====
var responseTimer = 0;
var penaltyTimer = 0;
var rewardDeliveryTimer = 0;
var interTrialTimer = 0;

// ===========================
// ====TASK INITIALIZATION====
// ===========================

overlay()

// ====Begin Task====
// Session is started by overlay object in the HTML file.


// =================
// ====FUNCTIONS====
// =================

// ====Task Functions====

function sessionStarter(){
  // ====Get Info From HTML Form====
  listType = Number(document.getElementById("list_type").value);
  trialCountCap = Number(document.getElementById("trial_num").value);
  pulseNumber = Number(document.getElementById("pulse_num").value);
  penaltyDelay = Number(document.getElementById("incorr_delay").value)*1000;
  categoryOrder = document.getElementById("cat_order").value;
  categoryOrder = categoryOrder.split(",");

  // ====Process Category Order====
  listLength = categoryOrder.length;
  console.log(categoryOrder);
  for(i=0;i<listLength;i++){
    for(j=0;j<century;j++){
      listRequest.push("/" + zeroPad(Number(categoryOrder[i]),4) + "-00-" + zeroPad(j,4));
    }
  }
  console.log(listRequest + ".dat");

  // ====Server Query===
  dataHttp.open("POST", listRequest + ".dat", false);
  dataHttp.send();
  dataList = dataHttp.responseText.split(",");
  // Set data file header
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET","subject_id,trial,correct_response,list_position,response_made,stim_time,response_time,x_coord,y_coord,ranks,images;.hed" ,true);
  xmlhttp.send();
  var confirmed = xmlhttp.responseText;

  // Assign subject ID
  subject_id = dataList[0];
  // Assign pictures to list
  for(i=0;i<dataList.length-2;i++){
    pth = "pics/" + i + ".jpg";
    lid = dataList[i+2];
    pos = -1;
    for(j=0;j<categoryOrder.length;j++){
      if(Number(lid.substring(0,4)) == categoryOrder[j]){
        pos = j;
      }
    }
    if(pos >= 0){
	  A = {filepath: pth, id: lid, rank: pos+1, correct: false};
	  picture_array.push(A);
	}
  }
console.log(picture_array.length + " images loaded.")

  // ====Configure Delay Array====
  for(i=0;i<pulseNumber;i++){
    delay_array.push(feedback_delay + i*300);
  }

  // ====Trial Structure Setup====
  combination_array = Array();
  for(i=0;i<trialCountCap;i++){
    trial_number.push(i.toString());
    temp_array = Array();
    for(s=0;s<categoryOrder.length;s++){
      var rand_s = 0;
      do {
        rand_s = picture_array[Math.floor(Math.random() * picture_array.length)];
      } while (!(rand_s.rank == s+1));
      temp_array.push(rand_s);
    }
    shuffle(temp_array);
    combination_array.push(temp_array);
  }
  session_length = trialCountCap;

  // ====Initialize Data Variables====
  trial_result = Array.apply(null, new Array(session_length)).map(String.prototype.valueOf,"");
  stim_time = Array.apply(null, new Array(session_length)).map(String.prototype.valueOf,"");
  result_time = Array.apply(null, new Array(session_length)).map(String.prototype.valueOf,"");
  result_x = Array.apply(null, new Array(session_length)).map(String.prototype.valueOf,"");
  result_y = Array.apply(null, new Array(session_length)).map(String.prototype.valueOf,"");
  trial_timeouts = Array.apply(null, new Array(session_length)).map(String.prototype.valueOf,"0");
  timeout_time = Array.apply(null, new Array(session_length)).map(String.prototype.valueOf,"0");
  interTrial_timeouts = Array.apply(null, new Array(session_length)).map(String.prototype.valueOf,"0");
  id_array = Array.apply(null, new Array(session_length)).map(String.prototype.valueOf,subject_id);
  console.log(session_length + " trials");

  // ====Hide Overlay And Begin Session====
  overlay();
  createTrialStarter();
}

function createTrialStarter(){
  current_trial = current_trial + 1;
  if(current_trial==session_length){
    console.log(current_trial + " , " + session_length);
    document.getElementById('louis').play();
    document.getElementById('louis').addEventListener('ended', function(){
      this.currentTime = 0;
      this.play();
    }, false);

  } else {
    var orientImg = document.createElement('img');
    orientImg.width = 200;
    orientImg.height = 200;
    orientImg.style.left = (Math.floor(w/2) - Math.floor(0.5*orientImg.width)) + "px";
    orientImg.style.top = (Math.floor(h/2) - Math.floor(0.5*orientImg.height)) + "px";
    orientImg.style.position = "absolute";
    orientImg.src = "pics/blue.spc";// + new Date().getTime();
    endAndStartTimer(interTrialTimer, 300, function(){document.body.appendChild(orientImg)});
    orientImg.addEventListener('touchstart', function(e){ resetVars(true); });
    orientImg.addEventListener('mousedown', function(e){ resetVars(true); });
    orientImg.addEventListener('onselect', function(){ clearSelection() });
    return orientImg;
  }
}

function resetVars(newTrialBool){
  // clears html document of image objects
  var selection = document.getElementsByTagName('img');
  do {
    selection[0].parentNode.removeChild(selection[0]);
  } while (selection.length > 0);
  for(i=0;i<listLength;i++){
    picture_array[i].correct = false;
    picture_array[i].class = "unclicked";
  }
  clearTimeout(responseTimer);
  clearTimeout(penaltyTimer);
  clearTimeout(rewardDeliveryTimer);
  clearTimeout(interTrialTimer);
  if(newTrialBool){
    // wait a second for next trial
    newTrial();
  }
}

function newTrial(){
  // runs through a single trial, picking a pair of images
  w = window.innerWidth;
  h = window.innerHeight;

  //    Accuracy to up to this trial
  //    counta = 0; countb = 0;
  //    for(var i = 0; i<current_trial; i++){
  //      if(trial_result[i]==1){counta += 1;}
  //      if(trial_result[i]==0){countb += 1;}
  //    }
  //    document.getElementById("debug").innerHTML = counta/(counta+countb);

  presentPosition = 0;
  current_pair = combination_array[current_trial];
  // create stimuli
  var stimulus_one = createStimulus(current_pair[0], 0.25, 0.25);
  var stimulus_two = createStimulus(current_pair[1], 0.75, 0.25);
  var stimulus_three = createStimulus(current_pair[2], 0.25, 0.75);
  var stimulus_four = createStimulus(current_pair[3], 0.75, 0.75);
  // store pairing
  trial_objects.push(current_pair);
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
  stimulus.correct = true;
  document.body.appendChild(stimulus);
  stim_time[current_trial] = new Date().getTime();
  var creation_time = new Date().getTime();
  // once image is clicked, experiment result is recorded and next trial starts
  stimulus.addEventListener('touchstart', function(e){ stimTouched(e, image_object, true, [stimulus.style.left, stimulus.style.top]) });
  stimulus.addEventListener('mousedown', function(e){ stimTouched(e, image_object, false, [stimulus.style.left, stimulus.style.top]) });
  stimulus.addEventListener('onselect', function(){ clearSelection() });
  return stimulus;
}

function stimTouched(e, image_object, is_touch, frame_style){
  if(is_touch){
    getTouchCoords(e, current_trial);
  } else {
    getMouseCoords(e, current_trial);
  }
  var event_time = new Date().getTime();
  result_time[current_trial] = event_time;
  image_object.class = "clicked";
  giveResult(image_object, true, frame_style);
  clearTimeout(responseTimer);
}

function giveResult(image, action_taken, frame_style){
  // records experiment, instigates new trial
  var stimulus = document.getElementById(image.id);
  if(action_taken){
    var interImg = document.createElement('img');
    interImg.width = 200;
    interImg.height = 200;
    interImg.style.left = (Math.floor(w/2) - Math.floor(0.5*interImg.width)) + "px";
    interImg.style.top = (Math.floor(h/2) - Math.floor(0.5*interImg.height)) + "px";
    interImg.style.position = "absolute";
    interImg.addEventListener('onselect', function(){ clearSelection() });
	if(image.rank == presentPosition+1){
	  presentPosition++;
	}
    console.log(presentPosition + ", " + image.rank)
    list_position[current_trial] = presentPosition;
    response_made[current_trial] = image.rank;
    if(presentPosition == categoryOrder.length){
      // if participant selects correct image
      trial_result[current_trial] = "1";
      console.log("Correct");
      delay = 0;
      interImg.src = "pics/check.spc";// + new Date().getTime();
      for(i=0;i<delay_array.length;i++){
        window.setTimeout(function(){
          dataHttp.open("GET", Math.random() + ".rwd", true);
          dataHttp.send();
        }, delay_array[i]);
      }
	  var confirmed = dataHttp.responseText;
      resetVars(false);
      document.body.appendChild(interImg);
      printToServer(current_trial);
      endAndStartTimer(rewardDeliveryTimer, feedback_delay, function(){
        resetVars(false)
        endAndStartTimer(penaltyTimer, delay, function(){
          var trial_starter = createTrialStarter();
        });
      });
    }
    // incorrect image
    else if(image.rank < presentPosition || image.rank > presentPosition){
      interImg.src = "pics/ex.spc";// + new Date().getTime();
      trial_result[current_trial] = "0";
      console.log("Incorrect");
      delay = penaltyDelay;
      resetVars(false);
      document.body.appendChild(interImg);
      printToServer(current_trial);
      endAndStartTimer(rewardDeliveryTimer, feedback_delay, function(){
        resetVars(false)
        endAndStartTimer(penaltyTimer, delay, function(){
          var trial_starter = createTrialStarter();
        });
      });
    } else {
      interImg.width = 350;
      interImg.height = 350;
      interImg.style.left = frame_style[0];
      interImg.style.top = frame_style[1];
      interImg.style.position = "absolute";
      interImg.id = "stim_frame";
      interImg.src = "pics/white-frame.spc";// + new Date().getTime();
      trial_result[current_trial] = "-";
      printToServer(current_trial);
      document.body.appendChild(interImg);
      setTimeout(function(){
        var item = document.getElementById("stim_frame");
        item.parentNode.removeChild(item);
      }, 250);
    }
  }
  else{
    timeout_time[current_trial] = new Date().getTime();
    trial_result[current_trial] = "-1";
    console.log("Timeout");
    printToServer(current_trial);
    resetVars(false);
    delay = 0;
    var trial_starter = createTrialStarter();
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

function clearSelection() {
    var elem = document.getElementsByTagName('img');
    setTimeout(function() {
               elem.selectionStart=0;
                elem.selectionEnd=0;
                }, 0);
    elem.value = prevoiusValue.substring(0,2);
}

function endAndStartTimer(id, interval, fun){
  window.clearTimeout(id)
  id = window.setTimeout(fun, interval)
}

function getTouchCoords(e, current_trial){
  var touchobj = e.changedTouches[0];
  var cursorX = parseInt(touchobj.clientX);
  var cursorY = parseInt(touchobj.clientY);
  result_x[current_trial] = cursorX; 
  result_y[current_trial] = cursorY;
//  document.getElementById("XY").innerHTML = cursorX + " , " + cursorY;
}

function getMouseCoords(e, current_trial){
  var cursorX = parseInt(e.clientX);
  var cursorY = parseInt(e.clientY);
  result_x[current_trial] = cursorX; 
  result_y[current_trial] = cursorY;
//  document.getElementById("XY").innerHTML = cursorX + " , " + cursorY;
}

function overlay() {
  el = document.getElementById("overlay");
  el.style.visibility = (el.style.visibility == "visible") ? "hidden" : "visible";
}

function shuffle(o){ 
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
};

function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}

function printToServer(trial_id){
  // Passes information from a single trial to the server
  print_string = "";
  var xmlhttp = new XMLHttpRequest();
  print_string += id_array[trial_id] + ",";
  print_string += trial_number[trial_id] + ",";
  print_string += trial_result[trial_id] + ",";
  print_string += list_position[trial_id] + ",";
  print_string += response_made[trial_id] + ",";
  print_string += stim_time[trial_id] + ",";
  print_string += result_time[trial_id] + ",";
  print_string += result_x[trial_id] + ",";
  print_string += result_y[trial_id] + ",";
  print_string += trial_objects[trial_id][0].rank + "|" + trial_objects[trial_id][1].rank + "|" + trial_objects[trial_id][2].rank + "|" + trial_objects[trial_id][3].rank + ",";
  print_string += trial_objects[trial_id][0].id   + "|" + trial_objects[trial_id][1].id   + "|" + trial_objects[trial_id][2].id   + "|" + trial_objects[trial_id][3].id   + ",";
  print_string += ";";
  xmlhttp.open("GET", print_string + ".sav" ,true);
  xmlhttp.send();
  var confirmed = xmlhttp.responseText;
}                                                    