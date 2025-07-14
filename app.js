// Dark Mode
const darkToggle = document.getElementById("darkModeToggle");
const body = document.body;

// Get DOM elements for timer display and input fields
let extractionTimeDisplay = document.getElementById("extractionTime");

let tastingSuggestions = document.getElementById("tastingSuggestions");
let tagList = document.getElementById("tagList");
let tastingNotesWrapper = document.getElementById("tastingNotesWrapper");
let tastingNotesInput = document.getElementById("tastingNotesInput");
let grindSize = document.getElementById("grindSize");
let observations = document.getElementById("observations");
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
let errLog = [];
let tastingTags = [];

// tasting notes
const commonEspressoTastingNotes = [
  "chocolate",
  "caramel",
  "hazelnut",
  "almond",
  "brown sugar",
  "vanilla",
  "citrus",
  "lemon",
  "berry",
  "cherry",
  "stone fruit",
  "floral",
  "honey",
  "toffee",
  "spice",
];

// Local Storage variables
let storedBrewLog;
let storedPreferences;

// Timer state tracking object
const timerState = {
  startTime: 0,
  elapsedTime: 0,
  interval: null,
  isRunning: false,
};

// Load preference
if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark-mode");
  darkToggle.textContent = "☀️";
} else {
  darkToggle.textContent = "🌙";
}

// Toggle theme
darkToggle.addEventListener("click", () => {
  body.classList.toggle("dark-mode");
  const theme = body.classList.contains("dark-mode") ? "dark" : "light";
  localStorage.setItem("theme", theme);

  darkToggle.textContent = theme === "dark" ? "☀️" : "🌙";
});

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

extractionTimeDisplay.addEventListener("blur", function () {
  errorLog.innerHTML = "";
  errLog = [];
  let inputString = extractionTimeDisplay.value;
  let formattedString = validateStringInput(inputString);

  if (formattedString === null) {
    errLog.push(
      "Please ensure that the timer entered is correctly formatted (e.g. 01:00.34)"
    );
    extractionTimeDisplay.value = "00:00.00";
  }
  if (errLog.length > 0) {
    for (let i = 0; i < errLog.length; ++i) {
      const li = document.createElement("li");
      li.textContent = errLog[i];
      errorLog.appendChild(li);
    }
    return;
  }

  extractionTimeDisplay.value = formattedString;

  let minutesArray = extractionTimeDisplay.value.split(":");
  let minutes = minutesArray[0];
  let secondsArray = minutesArray[1].split(".");
  let seconds = secondsArray[0];
  let hundredths = secondsArray[1];

  let totalMilliseconds =
    Number(minutes) * 60000 + Number(seconds) * 1000 + Number(hundredths) * 10;

  timerState.elapsedTime = totalMilliseconds;
  timerState.startTime = totalMilliseconds;
});

const validateStringInput = (str) => {
  // split the string into 3 (split at ":" and "." for mins, secs, and hundrths)
  if (str === null || str === "") {
    return null;
  } else if (!str.includes(":") && !str.includes(".")) {
    return null;
  }
  let minutesArray = str.split(":");
  let minutes = minutesArray[0];
  let secondsArray = minutesArray[1].split(".");
  let seconds = secondsArray[0];
  let hundredths = secondsArray[1];

  if (isNaN(minutes) || isNaN(seconds) || isNaN(hundredths)) {
    return null;
  } else if (Number(seconds) >= 60 || Number(hundredths) >= 100) {
    return null;
  }

  minutes = minutes.padStart(2, "0");
  seconds = seconds.padStart(2, "0");
  hundredths = hundredths.padStart(2, "0");
  return `${minutes}:${seconds}.${hundredths}`;
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
      <p><strong>Taste Notes:</strong> ${brew.tasteNotes?.length ? brew.tasteNotes.join(", ") : "N/A"}</p>
      <p><strong>Observations:</strong> ${brew.observations || "N/A"}</p>
    `;
    brewLogContainer.appendChild(card);
  }
};

const createRemoveTag = (tag) => {
  const span = document.createElement("span");
  span.classList.add("remove-tag");

  const text = document.createTextNode(tag + " ");
  const button = document.createElement("button");
  button.classList.add("remove-btn");
  button.innerHTML = "&times;";

  button.addEventListener("click", function () {
    span.remove();
    const index = tastingTags.indexOf(tag);
    if (index > -1) {
      tastingTags.splice(index, 1);
    }
  });

  span.appendChild(text);
  span.appendChild(button);
  tagList.appendChild(span);
};

// tasting Notes Input
tastingNotesInput.addEventListener("keydown", (event) => {
  errorLog.innerHTML = "";
  tastingNotesInput.classList.remove("input-error");
  errLog = [];
  let tagToAdd = tastingNotesInput.value.trim().toLowerCase();
  if (event.key === "Enter") {
    event.preventDefault();
    if (tagToAdd && !tastingTags.includes(tagToAdd)) {
      tastingTags.push(tagToAdd);

      createRemoveTag(tagToAdd);

      tastingSuggestions.style.display = "none";
      tastingNotesInput.value = "";
    } else {
      errLog.push("You have already added this tag! Please enter a new tag.");
      tastingNotesWrapper.classList.add("input-error");
    }
  }
});

tastingNotesInput.addEventListener("input", function () {
  tastingSuggestions.innerHTML = "";
  const userInput = tastingNotesInput.value.trim().toLowerCase();

  if (!userInput) {
    tastingSuggestions.style.display = "none";
    return;
  }

  const matches = commonEspressoTastingNotes.filter((note) => {
    return (
      note.toLowerCase().includes(userInput) && !tastingTags.includes(note)
    );
  });

  if (matches.length > 0) {
    tastingSuggestions.style.display = "block";
    matches.forEach((note) => {
      const li = document.createElement("li");
      li.classList.add("autocomplete-list");
      li.textContent = note;
      tastingSuggestions.appendChild(li);

      li.addEventListener("click", function () {
        let tagToAdd = li.textContent;
        if (!tastingTags.includes(tagToAdd)) {
          tastingTags.push(tagToAdd);
          createRemoveTag(tagToAdd);
          tastingNotesInput.value = "";
          tastingSuggestions.innerHTML = "";
          tastingSuggestions.style.display = "none";
        } else {
          tastingSuggestions.style.display = "none";
        }
      });
    });
  }
});

tastingNotesInput.addEventListener("blur", function () {
  setTimeout(() => {
    tastingSuggestions.style.display = "none";
  }, 150);
});

// Handle save button click: validate, log, render
const saveCoffeeLog = (event) => {
  event.preventDefault();
  errorLog.innerHTML = "";

  // Clear previous input error highlights
  [
    grindSize,
    doseIn,
    doseOut,
    observations,
    tastingNotesInput,
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

  if (timerState.elapsedTime <= 0 || extractionTimeDisplay.value <= 0) {
    errLog.push("Extraction time must be greater than 0.");
  }

  if (doseOut.value.trim() === "" || doseOut.value <= 0) {
    errLog.push("Please enter a valid number for coffee out.");
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
    doseIn: parseFloat(doseIn.value.trim()),
    doseOut: parseFloat(doseOut.value.trim()),
    tasteNotes: tastingTags,
    observations: observations.value.trim(),
    extractionTime: dateToStr(timerState.elapsedTime),
    brand: brand.value.trim(),
    roastLevel: roastLevel.value,
    machine: machine.value.trim(),
    grinder: grinder.value.trim(),
  };

  // last used fields for loading in
  let lastUsed = {
    brand: brand.value,
    roastLevel: roastLevel.value,
    machine: machine.value,
    grinder: grinder.value,
  };

  // Save brew and update UI
  brewLog.unshift(coffeeBrew);

  // save to local storage on save
  localStorage.setItem("brewLog", JSON.stringify(brewLog));
  localStorage.setItem("lastUsed", JSON.stringify(lastUsed));

  // render card and clear form, display save message
  renderCoffeeCard();
  clearTime(event);
  tastingTags = [];
  tagList.innerHTML = ""
  resetForm();

  if (storedPreferences) {
    const loadPreferences = JSON.parse(storedPreferences);
    brand.value = loadPreferences.brand;
    roastLevel.value = loadPreferences.roastLevel;
    machine.value = loadPreferences.machine;
    grinder.value = loadPreferences.grinder;
  } else {
    console.log("No saved preferences found in localStorage.");
  }

  errorLog.innerHTML = "<p style='color: green;'>Coffee log saved!</p>";
};

// load from local storage
const loadSavedBrewsFromLocalStorage = () => {
  storedBrewLog = localStorage.getItem("brewLog");
  storedPreferences = localStorage.getItem("lastUsed");

  if (storedBrewLog) {
    brewLog = JSON.parse(storedBrewLog);
    renderCoffeeCard();
  } else {
    console.log("No saved brews found in localStorage.");
  }

  if (storedPreferences) {
    const loadPreferences = JSON.parse(storedPreferences);
    brand.value = loadPreferences.brand;
    roastLevel.value = loadPreferences.roastLevel;
    machine.value = loadPreferences.machine;
    grinder.value = loadPreferences.grinder;
  } else {
    console.log("No saved preferences found in localStorage.");
  }
};

// Load brews from local storage
loadSavedBrewsFromLocalStorage();

// Attach event listeners to buttons
startStopTimer.addEventListener("click", startStop);
clearTimer.addEventListener("click", clearTime);
saveButton.addEventListener("click", saveCoffeeLog);
