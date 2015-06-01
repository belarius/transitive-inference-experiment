// Transitive Inference Task for use with Humans and Non-Human Primates
// client-side
// Brendon Villalobos

// gather preliminary data from server-side 
// (which pictures to use and subject id)
var dataHttp = new XMLHttpRequest();
dataHttp.open("GET", "info.dat", false);
dataHttp.send();
dataList = dataHttp.responseText.split(",");

// assign information to pictures A through E
A = {filepath: "pics/0.jpg", id: dataList[2], rank: 0, correct: false};
B = {filepath: "pics/1.jpg", id: dataList[3], rank: 1, correct: false};
C = {filepath: "pics/2.jpg", id: dataList[4], rank: 2, correct: false};
D = {filepath: "pics/3.jpg", id: dataList[5], rank: 3, correct: false};
E = {filepath: "pics/4.jpg", id: dataList[6], rank: 4, correct: false};


subject_id = dataList[0];
picture_array = [A, B, C, D, E];
trial_number = Array();
combination_array = Array();
session_length = 0;
for(i=0;i<5;i++){
  for(j=0;j<5;j++){
    if(i != j){
      session_length = session_length + 1;
      trial_number.push(session_length.toString());
      combination_array.push([picture_array[i], picture_array[j]]);
    }
  }
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
var feedback_delay = 700;

console.log(trial_number);
console.log(id_array);
console.log(trial_timeouts)

// put images in document body
newTrial()


// runs through a single trial, picking a pair of images
function newTrial(retry){
  current_trial = current_trial + 1;

  if(retry != true){
    // pulls a random combination from the array of combinations
    var this_combination = Math.floor(Math.random()*combination_array.length);
    var current_pair = combination_array[this_combination]
  }
 if(combination_array.length == 0){
    console.log("finished!");
    printToServer();
  }
  trial_objects.push(current_pair);
  console.log(trial_objects);
  combination_array.splice(this_combination, 1);
  var index1 = Math.floor(Math.random()*2);
  var index2;
  if(index1 == 1){
    index2 = 0;
  }
  else{
    index2 = 1;
  }
  console.log(combination_array);

  var stimulus_one = createStimulus(current_pair[index1]);
  var stimulus_two = createStimulus(current_pair[index2]);



  

  // create ranking
  if(current_pair[index1].rank < current_pair[index2].rank){
    current_pair[index1].correct = true;
  }
  else{
    current_pair[index2].correct = true;
    }
}

function checkClicked(source){
  var selection = document.getElementsByTagName('img');
  if(selection.length > 1 && (selection[0].src == source || selection[1].src == source)){
    if(selection[0].class === "unclicked" && selection[1].class === "unclicked"){
      selection[0].click();
    }
  }
}


// creates the stimulus
function createStimulus(image_object){
  var stimulus = document.createElement('img');
    stimulus.id = image_object.id;
    stimulus.src = image_object.filepath + new Date().getTime();
    stimulus.width = 250;
    stimulus.height = 250;
    stimulus.class = "unclicked";
    document.body.appendChild(stimulus);
    stim_time[current_trial] = new Date().getTime();
    var creation_time = new Date().getTime();
    // once image is clicked, experiment result is recorded and next trial starts
    stimulus.addEventListener('click', function(e){
      getCoords(e, current_trial);
      var event_time = new Date().getTime();
      result_time[current_trial] = event_time;
      image_object.class = "clicked";
      if(event_time - creation_time <= 10000){
        giveResult(image_object, true);
      }
      else{
        giveResult(image_object, false);
      }
    });
    if(current_trial != 0){
      setTimeout(function(){checkClicked(stimulus.src)}, 10000)
    }
    

    //stimulus.addEventListener('touchstart', function(){
    // giveResult(image_object);
    //})
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

// clears html document of image objects
function resetVars(newTrialBool){
  var selection = document.getElementsByTagName('img');
  for(i=0;i <= selection.length;i++){
    selection[0].parentNode.removeChild(selection[0]);
  }
  for(i=0;i<5;i++){
    picture_array[i].correct = false;
    picture_array[i].class = "unclicked";
  }
  if(newTrialBool){
    // wait a second for next trial
    newTrial();
  }
}

// present image to re-orientate participant
function presentInterTrial(timeout){
  if(typeof timeout == 'undefined'){
    var interImg = document.createElement('img');
    interImg.width = 150;
    interImg.height = 150;
    interImg.style.paddingLeft = "325px";
    interImg.style.paddingTop = "50px" ;
    if(trial_result[current_trial] === "0"){
      interImg.src = "pics/ex.spc" + new Date().getTime();
    }
    else if (trial_result[current_trial] == "1"){
      interImg.src = "pics/check.spc" + new Date().getTime();
    }
    document.body.appendChild(interImg);
    setTimeout(function(){
    resetVars(false)
      setTimeout(function(){
      var orientImg = document.createElement('img');
      orientImg.width = 150;
      orientImg.height = 150;
      orientImg.style.paddingLeft = "325px";
      orientImg.style.paddingTop = "50px" ;
      orientImg.src = "pics/bluesq.spc" + new Date().getTime();
      setTimeout(function(){document.body.appendChild(orientImg)}, 300);
      orientImg.addEventListener('click', function(e){
        resetVars(true);
        });
      }, delay);
    }, feedback_delay);
  }
  else if (timeout){
    var orientImg = document.createElement('img');
    orientImg.width = 150;
    orientImg.height = 150;
    orientImg.style.paddingLeft = "325px";
    orientImg.style.paddingTop = "50px" ;
    orientImg.src = "pics/bluesq.spc" + new Date().getTime();
    setTimeout(function(){document.body.appendChild(orientImg)}, 300);
    orientImg.addEventListener('click', function(e){
      resetVars(true);
    });
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