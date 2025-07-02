let extractionTimeDisplay = document.getElementById("extractionTime");

let coffeeType = document.getElementById("coffeeType");
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

let startTimer = document.getElementById("start");
let stopTimer = document.getElementById("stop");
let clearTimer = document.getElementById("clear");
let saveButton = document.getElementById("saveButton");

let brewLog = [];

const timerState = {
  startTime: 0,
  elapsedTime: 0,
  interval: null,
  isRunning: false,
};

const start = (event) => {
  event.preventDefault();
  if (!timerState.isRunning) {
    const initTimer = Date.now();
    timerState.interval = setInterval(function () {
      timerState.elapsedTime = Date.now() - initTimer + timerState.startTime;
      extractionTimeDisplay.innerHTML = dateToStr(timerState.elapsedTime);
    }, 10);
  }
  timerState.isRunning = true;
};

const stop = (event) => {
  if (event) {
    event.preventDefault();
    timerState.isRunning = false;
    timerState.startTime = timerState.elapsedTime;
    clearInterval(timerState.interval);
  }
};

const clearTime = (event) => {
  if (event) {
    stop(event);
    extractionTimeDisplay.innerHTML = "00:00.00";
    timerState.startTime = 0;
    timerState.elapsedTime = 0;
  }
};

const resetForm = () => {
  clearTime();
  const form = document.querySelector(".coffee-tracker");
  form.reset();
};

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

const renderCoffeeCard = () => {
  brewLogContainer.innerHTML = "";
  for (let i = 0; i < brewLog.length; ++i) {
    const brew = brewLog[i];
    const card = document.createElement("div");
    card.classList.add("brew-card");

    card.innerHTML = `
      <h3>${brew.coffeeType}</h3>
      <p><strong>Grind Size:</strong> ${brew.grindSize}</p>
      <p><strong>Coffee In:</strong> ${brew.doseIn}g</p>
      <p><strong>Coffee Out:</strong> ${brew.doseOut}g</p>
      <p><strong>Extraction Time:</strong> ${brew.extractionTime}</p>
      <p><strong>Taste Notes:</strong> ${brew.tasteNotes || "N/A"}</p>
      `;
    brewLogContainer.appendChild(card);
  }
};

const saveCoffeeLog = (event) => {
  let errLog = [];
  errorLog.innerHTML = "";

  if (coffeeType.value === "") {
    errLog.push("Please enter the type of coffee you brewed.");
  }
  if (grindSize.value === "") {
    errLog.push("Please enter the grind size of the coffee you brewed.");
  }
  if (grindSize.value <= 0 || grindSize.value > 60) {
    errLog.push("Grind size cannot be less than 0 or larger than 60.");
  }
  if (doseIn.value === "") {
    errLog.push("Coffee dose cannot be less than 0 or greater than 60.");
  }
  if (doseIn.value <= 0 || doseIn.value > 60) {
    errLog.push(
      "Coffee dose (Coffee in) cannot be less than 0 or greater than 60."
    );
  }
  if (timerState.elapsedTime <= 0 || !timerState.elapsedTime) {
    errLog.push("Extraction time (timer) has to be larger than 0.");
  }
  if (doseOut.value <= 0) {
    errLog.push("extracted coffee (Coffee out) cannot be less than 0.");
  }
  if (errLog.length > 0) {
    for (let i = 0; i < errLog.length; ++i) {
      const li = document.createElement("li");
      li.textContent = errLog[i];
      errorLog.appendChild(li);
    }
    event.preventDefault();
    return;
  } else {
    event.preventDefault();
    const coffeeBrew = {
      brand: brand.value,
      roastLevel: roastLevel.value,
      machine: machine.value,
      grinder: grinder.value,
      coffeeType: coffeeType.value,
      grindSize: parseFloat(grindSize.value),
      doseIn: parseFloat(doseIn.value),
      doseOut: parseFloat(doseOut.value),
      tasteNotes: tasteNotes.value,
      extractionTime: dateToStr(timerState.elapsedTime),
    };
    brewLog.push(coffeeBrew);
    renderCoffeeCard();
    clearTime(event);
    resetForm();
    errorLog.innerHTML = "<p style='color: green;'>Coffee log saved!</p>";
  }
};

startTimer.addEventListener("click", start);
stopTimer.addEventListener("click", stop);
clearTimer.addEventListener("click", clearTime);
saveButton.addEventListener("click", saveCoffeeLog);
