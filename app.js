// Get DOM elements for timer display and input fields
let extractionTimeDisplay = document.getElementById("extractionTime");

let grindSize = document.getElementById("grindSize");
let tasteNotes = document.getElementById("tasteNotes");
let doseIn = document.getElementById("doseIn");
let doseOut = document.getElementById("doseOut");
let errorLog = document.getElementById("errorContainer");
let brewLogContainer = document.getElementById("brewLogContainer");

let brand = document.getElementById("brand");
let roastLevel = document.getElementById("roastLevel");
let machine = document.getElementById("machine");
let grinder = document.getElementById("grinder");

// Get DOM elements for timer buttons and save button
let startStopTimer = document.getElementById("startStop");
let clearTimer = document.getElementById("clear");
let saveButton = document.getElementById("saveButton");

// Array to store all logged brews
let brewLog = [];

// Timer state tracking object
const timerState = {
  startTime: 0,
  elapsedTime: 0,
  interval: null,
  isRunning: false,
};

// Start the extraction timer
const start = (event) => {
  event.preventDefault();
  if (!timerState.isRunning) {
    extractionTimeDisplay.readOnly = true;
    const initTimer = Date.now();
    timerState.interval = setInterval(function () {
      timerState.elapsedTime = Date.now() - initTimer + timerState.startTime;
      extractionTimeDisplay.value = dateToStr(timerState.elapsedTime);
    }, 10);
  }
  timerState.isRunning = true;
};

// Stop the timer and store elapsed time
const stop = (event) => {
  if (event) {
    event.preventDefault();
    extractionTimeDisplay.readOnly = false;
    timerState.isRunning = false;
    timerState.startTime = timerState.elapsedTime;
    clearInterval(timerState.interval);
  }
};

// Change single button to start/stop and call each function if clicked on
const startStop = (event) => {
  if (!timerState.isRunning) {
    start(event);
    startStopTimer.classList.remove("start-button");
    startStopTimer.innerHTML = "Stop";
    startStopTimer.classList.add("stop-button");
  } else if (timerState.isRunning) {
    stop(event);
    startStopTimer.classList.remove("stop-button");
    startStopTimer.innerHTML = "Start";
    startStopTimer.classList.add("start-button");
  }
};

// Clear timer and reset display
const clearTime = (event) => {
  if (event) {
    stop(event);
    extractionTimeDisplay.value = "00:00.00";
    startStopTimer.classList.remove("stop-button");
    startStopTimer.innerHTML = "Start";
    startStopTimer.classList.add("start-button");
    timerState.startTime = 0;
    timerState.elapsedTime = 0;
  }
};

// Reset form inputs and clear timer
const resetForm = () => {
  clearTime();
  const form = document.querySelector(".coffee-tracker");
  form.reset();
};

// Format time (ms) into MM:SS.HH
function dateToStr(date) {
  let totalMilliseconds = date;
  let minutes = Math.floor(totalMilliseconds / 60000);
  let seconds = Math.floor((totalMilliseconds % 60000) / 1000);
  let milliseconds = totalMilliseconds % 1000;
  let convertToHundredths = Math.floor(milliseconds / 10);

  let formattedMinutes = String(minutes).padStart(2, "0");
  let formattedSeconds = String(seconds).padStart(2, "0");
  let formattedMillisecondToHundredths = String(convertToHundredths)
    .padStart(2, "0")
    .slice(0, 2);

  return `${formattedMinutes}:${formattedSeconds}.${formattedMillisecondToHundredths}`;
}

// Render each saved brew as a card in the UI
const renderCoffeeCard = () => {
  brewLogContainer.innerHTML = "";
  for (let i = 0; i < brewLog.length; ++i) {
    const brew = brewLog[i];
    const card = document.createElement("div");
    card.classList.add("brew-card");

    card.innerHTML = `
      <h3>${brew.brand}</h3>
      <p><strong>Roast Level:</strong> ${brew.roastLevel || "N/A"}</p>
      <p><strong>Machine:</strong> ${brew.machine || "N/A"}</p>
      <p><strong>Grinder:</strong> ${brew.grinder || "N/A"}</p>
      <p><strong>Grind Size:</strong> ${brew.grindSize}</p>
      <p><strong>Coffee In:</strong> ${brew.doseIn}g</p>
      <p><strong>Coffee Out:</strong> ${brew.doseOut}g</p>
      <p><strong>Extraction Time:</strong> ${brew.extractionTime}</p>
      <p><strong>Taste Notes:</strong> ${brew.tasteNotes || "N/A"}</p>
    `;
    brewLogContainer.appendChild(card);
  }
};

// Handle save button click: validate, log, render
const saveCoffeeLog = (event) => {
  event.preventDefault();
  console.log("hello");
  let errLog = [];
  errorLog.innerHTML = "";

  // Clear previous input error highlights
  [
    grindSize,
    doseIn,
    doseOut,
    tasteNotes,
    brand,
    roastLevel,
    machine,
    grinder,
  ].forEach((input) => input.classList.remove("input-error"));

  // Validation for each required field
  if (grindSize.value.trim() === "") {
    errLog.push("Please enter the grind size of the coffee you brewed.");
    grindSize.classList.add("input-error");
  } else if (grindSize.value.trim() <= 0 || grindSize.value.trim() > 60) {
    errLog.push("Grind size must be between 1 and 60.");
    grindSize.classList.add("input-error");
  }

  if (doseIn.value.trim() === "") {
    errLog.push("Please enter the dose of coffee in.");
    doseIn.classList.add("input-error");
  } else if (doseIn.value.trim() <= 0 || doseIn.value.trim() > 60) {
    errLog.push("Coffee dose (in) must be between 1 and 60.");
    doseIn.classList.add("input-error");
  }

  if (timerState.elapsedTime <= 0 || !timerState.elapsedTime) {
    errLog.push("Extraction time must be greater than 0.");
  }

  if (doseOut.value.trim() === "" || doseOut.value <= 0) {
    errLog.push("Please enter a valid value for coffee out.");
    doseOut.classList.add("input-error");
  }

  if (brand.value.trim() === "") {
    errLog.push("Please enter the brand of coffee.");
    brand.classList.add("input-error");
  }

  if (roastLevel.value === "") {
    errLog.push("Please select a roast level.");
    roastLevel.classList.add("input-error");
  }

  if (machine.value.trim() === "") {
    errLog.push("Please enter the machine you used.");
    machine.classList.add("input-error");
  }

  if (grinder.value.trim() === "") {
    errLog.push("Please enter the grinder you used.");
    grinder.classList.add("input-error");
  }

  // If validation failed, display errors
  if (errLog.length > 0) {
    for (let i = 0; i < errLog.length; ++i) {
      const li = document.createElement("li");
      li.textContent = errLog[i];
      errorLog.appendChild(li);
    }
    return;
  }

  // Create a new brew entry object
  const coffeeBrew = {
    grindSize: parseFloat(grindSize.value.trim()),
    doseIn: parseFloat(doseIn.value).trim(),
    doseOut: parseFloat(doseOut.value).trim(),
    tasteNotes: tasteNotes.value.trim(),
    extractionTime: dateToStr(timerState.elapsedTime),
    brand: brand.value.trim(),
    roastLevel: roastLevel.value,
    machine: machine.value.trim(),
    grinder: grinder.value.trim(),
  };

  // Save brew and update UI
  brewLog.push(coffeeBrew);
  renderCoffeeCard();
  clearTime(event);
  resetForm();
  errorLog.innerHTML = "<p style='color: green;'>Coffee log saved!</p>";
};

// Attach event listeners to buttons
startStopTimer.addEventListener("click", startStop);
clearTimer.addEventListener("click", clearTime);
saveButton.addEventListener("click", saveCoffeeLog);
