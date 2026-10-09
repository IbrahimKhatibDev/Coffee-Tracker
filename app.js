// Dark Mode
const darkToggle = document.getElementById("darkModeToggle");
const body = document.body;

// Get DOM elements for timer display and input fields
let extractionTimeDisplay = document.getElementById("extractionTime");

let tastingSuggestions = document.getElementById("tastingSuggestions");
let tagList = document.getElementById("tagList");
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

// Filter elements
const filterRoast = document.getElementById("filterBrewsByRoast");
const filterTime = document.getElementById("filterBrewsByTime");
const applyFiltersButton = document.getElementById("applyFiltersButton");

// Form inputs keyed by the field names used in validation
const formFields = {
  brand,
  roastLevel,
  machine,
  grinder,
  grindSize,
  doseIn,
  extractionTime: extractionTimeDisplay,
  doseOut,
};

// Toggle Button
const toggleBtn = document.getElementById("toggleFilter");
const toggleIcon = document.getElementById("toggleIcon");
const filterContent = document.getElementById("filterContent");

toggleBtn.addEventListener("click", () => {
  const isHidden = filterContent.classList.toggle("hidden");
  toggleIcon.textContent = isHidden ? "+" : "−";
  toggleBtn.setAttribute("aria-expanded", !isHidden);
});

// globals
let brewLog = [];
let editingCard = null;
let activeFilters = { roastLevel: "", sort: "", tags: [] };

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

function showConfirm(message, onConfirm) {
  const modal = document.getElementById("confirmModal");
  const messageEl = document.getElementById("confirmMessage");
  const yesBtn = document.getElementById("confirmYes");
  const noBtn = document.getElementById("confirmNo");

  messageEl.textContent = message;
  modal.classList.remove("hidden");

  // Clean up previous handlers
  const cloneYes = yesBtn.cloneNode(true);
  const cloneNo = noBtn.cloneNode(true);
  yesBtn.replaceWith(cloneYes);
  noBtn.replaceWith(cloneNo);

  cloneYes.addEventListener("click", () => {
    modal.classList.add("hidden");
    onConfirm(true);
  });

  cloneNo.addEventListener("click", () => {
    modal.classList.add("hidden");
    onConfirm(false);
  });
}

// Display a list of error messages (clears the container when empty)
const showErrors = (messages, container = errorLog) => {
  container.innerHTML = "";
  if (messages.length === 0) return;

  const ul = document.createElement("ul");
  messages.forEach((message) => {
    const li = document.createElement("li");
    li.textContent = message;
    ul.appendChild(li);
  });
  container.appendChild(ul);
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

extractionTimeDisplay.addEventListener("blur", function () {
  // Ignore blur while the timer is running, it owns the display
  if (timerState.isRunning) return;

  let totalMilliseconds = parseTime(extractionTimeDisplay.value);

  if (totalMilliseconds === null) {
    showErrors([
      "Please ensure that the timer entered is correctly formatted (e.g. 01:00.34)",
    ]);
    totalMilliseconds = 0;
  } else {
    showErrors([]);
  }

  extractionTimeDisplay.value = dateToStr(totalMilliseconds);
  timerState.elapsedTime = totalMilliseconds;
  timerState.startTime = totalMilliseconds;
});

// Parse "MM:SS.HH" (hundredths optional) into milliseconds, or null if invalid
const parseTime = (str) => {
  const match = /^(\d{1,2}):(\d{1,2})(?:\.(\d{1,2}))?$/.exec(str.trim());
  if (!match) return null;

  const [, minutes, seconds, hundredths = "0"] = match;
  if (Number(seconds) >= 60) return null;

  // "30.5" means 30.50 seconds, so pad hundredths on the right
  return (
    Number(minutes) * 60000 +
    Number(seconds) * 1000 +
    Number(hundredths.padEnd(2, "0")) * 10
  );
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

// Validate brew values, returning a list of { field, message }
const validateBrew = (values) => {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });

  const checkNumber = (field, max, missingMessage, rangeMessage) => {
    const str = String(values[field]).trim();
    if (str === "") {
      add(field, missingMessage);
    } else if (!(Number(str) > 0 && Number(str) <= max)) {
      add(field, rangeMessage);
    }
  };

  if (values.brand.trim() === "") {
    add("brand", "Please enter the brand of coffee.");
  }

  if (values.roastLevel === "") {
    add("roastLevel", "Please select a roast level.");
  }

  if (values.machine.trim() === "") {
    add("machine", "Please enter the machine you used.");
  }

  if (values.grinder.trim() === "") {
    add("grinder", "Please enter the grinder you used.");
  }

  checkNumber(
    "grindSize",
    60,
    "Please enter the grind size of the coffee you brewed.",
    "Grind size must be greater than 0 and no more than 60."
  );

  checkNumber(
    "doseIn",
    60,
    "Please enter the dose of coffee in.",
    "Coffee dose (in) must be greater than 0 and no more than 60."
  );

  if (values.extractionMs === null) {
    add(
      "extractionTime",
      "Please ensure that the extraction time is correctly formatted (e.g. 01:00.34)"
    );
  } else if (values.extractionMs <= 0) {
    add("extractionTime", "Extraction time must be greater than 0.");
  }

  checkNumber(
    "doseOut",
    100,
    "Please enter the amount of coffee out.",
    "Coffee out must be greater than 0 and no more than 100."
  );

  return errors;
};

// Convert validated values into the fields stored on a brew
const toBrewFields = (values) => ({
  brand: values.brand.trim(),
  roastLevel: values.roastLevel,
  machine: values.machine.trim(),
  grinder: values.grinder.trim(),
  grindSize: parseFloat(values.grindSize),
  doseIn: parseFloat(values.doseIn),
  extractionTime: dateToStr(values.extractionMs),
  doseOut: parseFloat(values.doseOut),
  tasteNotes: values.tasteNotes,
  observations: values.observations.trim(),
});

const createCoffeCardElements = () => {
  const cardActions = document.createElement("div");
  cardActions.classList.add("card-actions");

  const deleteButton = document.createElement("button");
  deleteButton.classList.add("card-btn", "delete-btn");
  deleteButton.textContent = "X";

  const editCancelButton = document.createElement("button");
  editCancelButton.classList.add("card-btn", "edit-btn");
  editCancelButton.textContent = "Edit";

  cardActions.appendChild(editCancelButton);
  cardActions.appendChild(deleteButton);
  return cardActions;
};

// Build a "Label: value" line for a card, safe for any user text
const createCardField = (label, value) => {
  const p = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = `${label}:`;
  p.append(strong, ` ${value}`);
  return p;
};

// Brews matching the applied filters, in the chosen order
const getVisibleBrews = () => {
  const { roastLevel, sort, tags } = activeFilters;

  const visible = brewLog.filter((brew) => {
    const notes = (brew.tasteNotes || []).map((note) => note.toLowerCase());
    return (
      (!roastLevel || brew.roastLevel === roastLevel) &&
      tags.every((tag) => notes.includes(tag))
    );
  });

  // ids are creation timestamps
  return visible.sort((a, b) => (sort === "Oldest" ? a.id - b.id : b.id - a.id));
};

// Render each saved brew as a card in the UI
const renderCoffeeCard = () => {
  brewLogContainer.innerHTML = "";
  // Re-rendering discards any open edit form
  editingCard = null;

  const visibleBrews = getVisibleBrews();

  if (visibleBrews.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent =
      brewLog.length === 0
        ? "No brews saved yet."
        : "No brews match these filters.";
    brewLogContainer.appendChild(emptyMessage);
    return;
  }

  for (let i = 0; i < visibleBrews.length; ++i) {
    const brew = visibleBrews[i];

    const card = document.createElement("div");
    card.classList.add("brew-card");

    const cardActions = createCoffeCardElements();

    const title = document.createElement("h3");
    title.textContent = brew.brand;
    card.appendChild(title);

    [
      ["Roast Level", brew.roastLevel || "N/A"],
      ["Machine", brew.machine || "N/A"],
      ["Grinder", brew.grinder || "N/A"],
      ["Grind Size", brew.grindSize],
      ["Coffee In", `${brew.doseIn}g`],
      ["Coffee Out", `${brew.doseOut}g`],
      ["Extraction Time", brew.extractionTime],
      [
        "Taste Notes",
        brew.tasteNotes?.length ? brew.tasteNotes.join(", ") : "N/A",
      ],
      ["Observations", brew.observations || "N/A"],
    ].forEach(([label, value]) =>
      card.appendChild(createCardField(label, value))
    );

    card.appendChild(cardActions);
    brewLogContainer.appendChild(card);

    const editCancelButton = cardActions.querySelector(".edit-btn");
    const deleteButton = cardActions.querySelector(".delete-btn");

    editCancelButton.addEventListener("click", () => {
      if (editingCard && editingCard !== card) return; // prevent multiple edits

      if (editCancelButton.classList.contains("edit-btn")) {
        // Switch to edit mode
        editingCard = card;
        card.innerHTML = "";

        // Editable form fields (values are set below so user text can't break the markup)
        const editForm = document.createElement("div");
        editForm.classList.add("edit-form");

        editForm.innerHTML = `
            <div class="error-messages edit-errors"></div>

            <div class="edit-field">
                <label>Brand:</label>
                <input type="text" class="edit-brand" />
            </div>

            <div class="edit-field">
                <label>Roast Level:</label>
                <select class="edit-roastLevel">
                <option value="Light">Light</option>
                <option value="Medium">Medium</option>
                <option value="Dark">Dark</option>
                </select>
            </div>

            <div class="edit-field">
                <label>Machine:</label>
                <input type="text" class="edit-machine" />
            </div>

            <div class="edit-field">
                <label>Grinder:</label>
                <input type="text" class="edit-grinder" />
            </div>

            <div class="edit-field">
                <label>Grind Size:</label>
                <input type="number" step="any" class="edit-grindSize" />
            </div>

            <div class="edit-field">
                <label>Coffee In (g):</label>
                <input type="number" step="any" class="edit-doseIn" />
            </div>

            <div class="edit-field">
                <label>Coffee Out (g):</label>
                <input type="number" step="any" class="edit-doseOut" />
            </div>

            <div class="edit-field">
                <label>Extraction Time:</label>
                <input type="text" class="edit-extractionTime" />
            </div>

            <div class="edit-field">
                <label>Taste Notes:</label>
                <input type="text" class="edit-tasteNotes" />
            </div>

            <div class="edit-field">
                <label>Observations:</label>
                <textarea class="edit-observations"></textarea>
            </div>
            `;

        const editInput = (name) => editForm.querySelector(`.edit-${name}`);
        editInput("brand").value = brew.brand ?? "";
        editInput("roastLevel").value = brew.roastLevel || "Light";
        editInput("machine").value = brew.machine ?? "";
        editInput("grinder").value = brew.grinder ?? "";
        editInput("grindSize").value = brew.grindSize ?? "";
        editInput("doseIn").value = brew.doseIn ?? "";
        editInput("doseOut").value = brew.doseOut ?? "";
        editInput("extractionTime").value = brew.extractionTime ?? "";
        editInput("tasteNotes").value = brew.tasteNotes?.join(", ") || "";
        editInput("observations").value = brew.observations || "";

        card.appendChild(editForm);

        // Add Save & Cancel buttons
        const actions = createCoffeCardElements();
        const saveButton = document.createElement("button");
        saveButton.classList.add("card-btn", "save-btn");
        saveButton.textContent = "Save";

        const cancelButton = document.createElement("button");
        cancelButton.classList.add("card-btn", "cancel-btn");
        cancelButton.textContent = "Cancel";

        actions.innerHTML = "";
        actions.appendChild(saveButton);
        actions.appendChild(cancelButton);
        card.appendChild(actions);

        saveButton.addEventListener("click", () => {
          const values = {
            brand: editInput("brand").value,
            roastLevel: editInput("roastLevel").value,
            machine: editInput("machine").value,
            grinder: editInput("grinder").value,
            grindSize: editInput("grindSize").value,
            doseIn: editInput("doseIn").value,
            extractionMs: parseTime(editInput("extractionTime").value),
            doseOut: editInput("doseOut").value,
            tasteNotes: editInput("tasteNotes")
              .value.split(",")
              .map((note) => note.trim().toLowerCase())
              .filter(Boolean),
            observations: editInput("observations").value,
          };

          const errors = validateBrew(values);
          editForm
            .querySelectorAll(".input-error")
            .forEach((input) => input.classList.remove("input-error"));
          errors.forEach(({ field }) =>
            editInput(field).classList.add("input-error")
          );
          showErrors(
            errors.map(({ message }) => message),
            editForm.querySelector(".edit-errors")
          );
          if (errors.length > 0) return;

          showConfirm(
            "Are you sure you want to save the changes you've made?",
            (confirmed) => {
              if (confirmed) {
                const updatedBrew = { ...brew, ...toBrewFields(values) };

                brewLog = brewLog.map((entry) =>
                  entry.id === brew.id ? updatedBrew : entry
                );
                localStorage.setItem("brewLog", JSON.stringify(brewLog));
                renderCoffeeCard();
              }
            }
          );
        });

        cancelButton.addEventListener("click", () => {
          showConfirm("Are you sure you want to cancel?", (confirmed) => {
            if (confirmed) {
              renderCoffeeCard();
            }
          });
        });
      }
    });

    deleteButton.addEventListener("click", () => {
      cardDelete(brew.id);
    });
  }
};

const cardDelete = (id) => {
  showConfirm(
    "Are you sure you would like to delete this Log?",
    (confirmed) => {
      if (confirmed) {
        brewLog = brewLog.filter((entry) => entry.id !== id);
        localStorage.setItem("brewLog", JSON.stringify(brewLog));
        renderCoffeeCard();
      }
    }
  );
};

// Wire up a tag input with autocomplete suggestions
const createTagInput = ({ input, suggestions, list, getOptions, onDuplicate }) => {
  let tags = [];

  const hideSuggestions = () => {
    suggestions.innerHTML = "";
    suggestions.style.display = "none";
  };

  const addTag = (tag) => {
    tags.push(tag);

    const span = document.createElement("span");
    span.classList.add("remove-tag");

    const text = document.createTextNode(tag + " ");
    const button = document.createElement("button");
    button.type = "button"; // a default submit button would submit the form
    button.classList.add("remove-btn");
    button.setAttribute("aria-label", `Remove ${tag}`);
    button.innerHTML = "&times;";

    button.addEventListener("click", function () {
      span.remove();
      tags = tags.filter((t) => t !== tag);
    });

    span.appendChild(text);
    span.appendChild(button);
    list.appendChild(span);

    input.value = "";
    hideSuggestions();
  };

  input.addEventListener("keydown", (event) => {
    input.classList.remove("input-error");
    if (event.key !== "Enter") return;

    event.preventDefault();
    const tagToAdd = input.value.trim().toLowerCase();
    if (!tagToAdd) return;

    if (tags.includes(tagToAdd)) {
      input.classList.add("input-error");
      onDuplicate?.();
      return;
    }
    addTag(tagToAdd);
  });

  input.addEventListener("input", function () {
    suggestions.innerHTML = "";
    const userInput = input.value.trim().toLowerCase();

    const matches = userInput
      ? getOptions().filter(
          (note) => note.includes(userInput) && !tags.includes(note)
        )
      : [];

    if (matches.length === 0) {
      hideSuggestions();
      return;
    }

    suggestions.style.display = "block";
    matches.forEach((note) => {
      const li = document.createElement("li");
      li.classList.add("autocomplete-item");
      li.textContent = note;
      li.addEventListener("click", () => addTag(note));
      suggestions.appendChild(li);
    });
  });

  input.addEventListener("blur", function () {
    setTimeout(hideSuggestions, 150);
  });

  return {
    getTags: () => [...tags],
    clear: () => {
      tags = [];
      list.innerHTML = "";
    },
  };
};

// tasting Notes Input
const tastingNotes = createTagInput({
  input: tastingNotesInput,
  suggestions: tastingSuggestions,
  list: tagList,
  getOptions: () => commonEspressoTastingNotes,
  onDuplicate: () =>
    showErrors(["You have already added this tag! Please enter a new tag."]),
});

// Filter tasting notes: suggest common notes plus any used in saved brews
const filterTastingNotes = createTagInput({
  input: document.getElementById("filterTastingNotesInput"),
  suggestions: document.getElementById("filterTastingSuggestions"),
  list: document.getElementById("filterTagList"),
  getOptions: () => [
    ...new Set([
      ...commonEspressoTastingNotes,
      ...brewLog.flatMap((brew) =>
        (brew.tasteNotes || []).map((note) => note.toLowerCase())
      ),
    ]),
  ],
});

applyFiltersButton.addEventListener("click", () => {
  activeFilters = {
    roastLevel: filterRoast.value,
    sort: filterTime.value,
    tags: filterTastingNotes.getTags(),
  };
  renderCoffeeCard();
});

// Fill the brand/roast/machine/grinder fields from saved preferences
const applyPreferences = (preferences) => {
  brand.value = preferences.brand;
  roastLevel.value = preferences.roastLevel;
  machine.value = preferences.machine;
  grinder.value = preferences.grinder;
};

// Handle save button click: validate, log, render
const saveCoffeeLog = (event) => {
  event.preventDefault();

  // Clear previous input error highlights
  [...Object.values(formFields), tastingNotesInput].forEach((input) =>
    input.classList.remove("input-error")
  );

  const values = {
    brand: brand.value,
    roastLevel: roastLevel.value,
    machine: machine.value,
    grinder: grinder.value,
    grindSize: grindSize.value,
    doseIn: doseIn.value,
    extractionMs: timerState.elapsedTime,
    doseOut: doseOut.value,
    tasteNotes: tastingNotes.getTags(),
    observations: observations.value,
  };

  // If validation failed, display errors
  const errors = validateBrew(values);
  errors.forEach(({ field }) => formFields[field].classList.add("input-error"));
  showErrors(errors.map(({ message }) => message));
  if (errors.length > 0) return;

  // Create a new brew entry object
  const coffeeBrew = { id: Date.now(), ...toBrewFields(values) };

  // last used fields for loading in
  const lastUsed = {
    brand: coffeeBrew.brand,
    roastLevel: coffeeBrew.roastLevel,
    machine: coffeeBrew.machine,
    grinder: coffeeBrew.grinder,
  };

  // Save brew and update UI
  brewLog.unshift(coffeeBrew);

  // save to local storage on save
  localStorage.setItem("brewLog", JSON.stringify(brewLog));
  localStorage.setItem("lastUsed", JSON.stringify(lastUsed));

  // render card and clear form, display save message
  renderCoffeeCard();
  clearTime(event);
  tastingNotes.clear();
  resetForm();
  applyPreferences(lastUsed);

  errorLog.innerHTML = `<p class="success-message">Coffee log saved!</p>`;
};

// load from local storage
const loadSavedBrewsFromLocalStorage = () => {
  const storedBrewLog = localStorage.getItem("brewLog");
  const storedPreferences = localStorage.getItem("lastUsed");

  if (storedBrewLog) {
    brewLog = JSON.parse(storedBrewLog);
  }
  renderCoffeeCard();

  if (storedPreferences) {
    applyPreferences(JSON.parse(storedPreferences));
  }
};

// Load brews from local storage
loadSavedBrewsFromLocalStorage();

// Attach event listeners to buttons
startStopTimer.addEventListener("click", startStop);
clearTimer.addEventListener("click", clearTime);
saveButton.addEventListener("click", saveCoffeeLog);
