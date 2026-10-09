// Dark Mode
const darkToggle = document.getElementById("darkModeToggle");
const root = document.documentElement;

// Form elements
const form = document.querySelector(".coffee-tracker");
const extractionTimeDisplay = document.getElementById("extractionTime");
const tastingSuggestions = document.getElementById("tastingSuggestions");
const tagList = document.getElementById("tagList");
const tastingNotesInput = document.getElementById("tastingNotesInput");
const grindSize = document.getElementById("grindSize");
const observations = document.getElementById("observations");
const doseIn = document.getElementById("doseIn");
const doseOut = document.getElementById("doseOut");
const ratioPreview = document.getElementById("ratioPreview");
const statusArea = document.getElementById("errorContainer");
const brewLogContainer = document.getElementById("brewLogContainer");

const brand = document.getElementById("brand");
const roastLevel = document.getElementById("roastLevel");
const machine = document.getElementById("machine");
const grinder = document.getElementById("grinder");

// Timer buttons
const startStopTimer = document.getElementById("startStop");
const clearTimer = document.getElementById("clear");

// Filter elements
const filterRoast = document.getElementById("filterBrewsByRoast");
const filterTime = document.getElementById("filterBrewsByTime");
const applyFiltersButton = document.getElementById("applyFiltersButton");
const resetFiltersButton = document.getElementById("resetFiltersButton");

// Export / import elements
const exportButton = document.getElementById("exportButton");
const importButton = document.getElementById("importButton");
const importFile = document.getElementById("importFile");
const libraryStatus = document.getElementById("libraryStatus");

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
  tasteNotes: tastingNotesInput,
  observations,
};

// Validation limits
const ROAST_LEVELS = ["Light", "Medium", "Dark"];
const MAX_TEXT = 60;
const MAX_OBSERVATIONS = 500;
const MAX_TAG_LENGTH = 30;
const MAX_TAGS = 12;
const MIN_TIME_MS = 1000;
const MAX_TIME_MS = 3 * 60 * 1000;
const MIN_RATIO = 0.5;
const MAX_RATIO = 6;
const TAG_PATTERN = /^[\p{L}][\p{L}' -]*$/u;
const TIME_FORMAT_MESSAGE = "Use the format MM:SS.hh (e.g. 00:28.50).";

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
  interval: null,
  isRunning: false,
};

// -------------------- STORAGE --------------------

// localStorage can throw (private mode, quota) or hold corrupt JSON
const readStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const persistBrewLog = (container = statusArea) => {
  if (writeStorage("brewLog", brewLog)) return true;
  setStatus(
    container,
    "error",
    "Couldn't save to this browser's storage. It may be full or disabled."
  );
  return false;
};

// -------------------- THEME --------------------

// The theme class is applied in <head> before paint; keep the toggle in sync
const syncThemeToggle = () => {
  const isDark = root.classList.contains("dark-mode");
  darkToggle.textContent = isDark ? "☀️" : "🌙";
  darkToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light mode" : "Switch to dark mode"
  );
};

syncThemeToggle();

darkToggle.addEventListener("click", () => {
  root.classList.toggle("dark-mode");
  try {
    localStorage.setItem(
      "theme",
      root.classList.contains("dark-mode") ? "dark" : "light"
    );
  } catch {
    // Theme still applies for this visit
  }
  syncThemeToggle();
});

// -------------------- MESSAGES --------------------

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
  cloneYes.focus();

  cloneYes.addEventListener("click", () => {
    modal.classList.add("hidden");
    onConfirm(true);
  });

  cloneNo.addEventListener("click", () => {
    modal.classList.add("hidden");
    onConfirm(false);
  });
}

// Show one status banner (error or success); success messages fade on their own
const statusTimers = new WeakMap();

const setStatus = (container, type, message) => {
  clearTimeout(statusTimers.get(container));
  container.replaceChildren();

  const p = document.createElement("p");
  p.className = `status status-${type}`;
  p.textContent = message;
  container.appendChild(p);

  if (type === "success") {
    statusTimers.set(
      container,
      setTimeout(() => container.replaceChildren(), 4000)
    );
  }
};

const clearStatus = (container) => {
  clearTimeout(statusTimers.get(container));
  container.replaceChildren();
};

// Inline error shown under a single field
const FIELD_GROUP = ".input-group, .edit-field, .filter-group";
let fieldErrorCount = 0;

const setFieldError = (input, message) => {
  const group = input.closest(FIELD_GROUP);
  let errorEl = group.querySelector(":scope > .field-error");
  if (!errorEl) {
    errorEl = document.createElement("p");
    errorEl.className = "field-error";
    errorEl.id = `field-error-${++fieldErrorCount}`;
    group.appendChild(errorEl);
  }
  errorEl.textContent = message;

  // Remember any existing description (e.g. the timer hint) so it survives
  input.dataset.describedby ??= input.getAttribute("aria-describedby") || "";
  input.setAttribute(
    "aria-describedby",
    `${input.dataset.describedby} ${errorEl.id}`.trim()
  );
  input.setAttribute("aria-invalid", "true");
  input.classList.add("input-error");
};

const clearFieldError = (input) => {
  if (input.getAttribute("aria-invalid") !== "true") return;

  input.closest(FIELD_GROUP)?.querySelector(":scope > .field-error")?.remove();
  input.classList.remove("input-error");
  input.removeAttribute("aria-invalid");

  const describedBy = input.dataset.describedby;
  if (describedBy) {
    input.setAttribute("aria-describedby", describedBy);
  } else {
    input.removeAttribute("aria-describedby");
  }
};

const clearAllFieldErrors = (scope) => {
  scope.querySelectorAll('[aria-invalid="true"]').forEach(clearFieldError);
};

// Mark each invalid field, summarise in the banner and focus the first one
const reportErrors = (errors, inputFor, container) => {
  errors.forEach(({ field, message }) =>
    setFieldError(inputFor(field), message)
  );
  setStatus(
    container,
    "error",
    errors.length === 1
      ? "Please fix the highlighted field."
      : `Please fix the ${errors.length} highlighted fields.`
  );
  inputFor(errors[0].field).focus();
};

// Clear a field's error as soon as it's edited, and the banner once all are fixed
const watchFieldErrors = (scope, container) => {
  const onEdit = (event) => {
    clearFieldError(event.target);
    if (
      container.querySelector(".status-error") &&
      !scope.querySelector('[aria-invalid="true"]')
    ) {
      clearStatus(container);
    }
  };
  scope.addEventListener("input", onEdit);
  scope.addEventListener("change", onEdit);
};

watchFieldErrors(form, statusArea);

// -------------------- TIMER --------------------

const setStartStopLabel = (isRunning) => {
  startStopTimer.textContent = isRunning ? "Stop" : "Start";
  startStopTimer.classList.toggle("stop-button", isRunning);
  startStopTimer.classList.toggle("start-button", !isRunning);
};

// Start (or resume) from whatever time is currently shown
const startTimer = () => {
  if (timerState.isRunning) return;

  const offset = parseTime(extractionTimeDisplay.value) ?? 0;
  const startedAt = Date.now();
  clearFieldError(extractionTimeDisplay);
  extractionTimeDisplay.readOnly = true;

  timerState.interval = setInterval(() => {
    extractionTimeDisplay.value = dateToStr(Date.now() - startedAt + offset);
  }, 10);
  timerState.isRunning = true;
  setStartStopLabel(true);
};

const stopTimer = () => {
  clearInterval(timerState.interval);
  extractionTimeDisplay.readOnly = false;
  timerState.isRunning = false;
  setStartStopLabel(false);
};

const resetTimer = () => {
  stopTimer();
  extractionTimeDisplay.value = "00:00.00";
  clearFieldError(extractionTimeDisplay);
};

// Tidy a typed time on blur, or flag it if it can't be read
extractionTimeDisplay.addEventListener("blur", () => {
  // Ignore blur while the timer is running, it owns the display
  if (timerState.isRunning) return;

  const totalMilliseconds = parseTime(extractionTimeDisplay.value);
  if (totalMilliseconds === null) {
    setFieldError(extractionTimeDisplay, TIME_FORMAT_MESSAGE);
  } else {
    extractionTimeDisplay.value = dateToStr(totalMilliseconds);
  }
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

// Format time (ms) into MM:SS.HH
function dateToStr(totalMilliseconds) {
  const minutes = Math.floor(totalMilliseconds / 60000);
  const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
  const hundredths = Math.floor((totalMilliseconds % 1000) / 10);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}.${String(hundredths).padStart(2, "0")}`;
}

// -------------------- RATIO --------------------

// "1:2.0" for an 18g dose and 36g yield, or a dash until both are usable
const formatRatio = (dose, yieldGrams) => {
  const d = Number(dose);
  const y = Number(yieldGrams);
  if (!(d > 0 && y > 0)) return "—";
  return `1:${(y / d).toFixed(1)}`;
};

const updateRatioPreview = () => {
  ratioPreview.textContent = formatRatio(doseIn.value, doseOut.value);
};

doseIn.addEventListener("input", updateRatioPreview);
doseOut.addEventListener("input", updateRatioPreview);

// -------------------- VALIDATION --------------------

// Lowercase and collapse spacing so "Dark  Chocolate" matches "dark chocolate"
const normalizeTag = (tag) => tag.trim().toLowerCase().replace(/\s+/g, " ");

// Returns an error message for a tasting note, or null if it's fine
const validateTag = (tag, existing) => {
  if (tag.length > MAX_TAG_LENGTH) {
    return `Keep notes to ${MAX_TAG_LENGTH} characters or fewer.`;
  }
  if (!TAG_PATTERN.test(tag)) {
    return "Notes can only use letters, spaces, hyphens and apostrophes.";
  }
  if (existing.includes(tag)) {
    return `“${tag}” is already added.`;
  }
  if (existing.length >= MAX_TAGS) {
    return `You can add up to ${MAX_TAGS} notes.`;
  }
  return null;
};

// A number input holding non-numeric text reports an empty value; keep it invalid
const readNumber = (input) => (input.validity.badInput ? "NaN" : input.value);

// Validate brew values, returning a list of { field, message }
const validateBrew = (values) => {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });

  const checkText = (field, missingMessage) => {
    const str = String(values[field] ?? "").trim();
    if (str === "") {
      add(field, missingMessage);
    } else if (str.length > MAX_TEXT) {
      add(field, `Use ${MAX_TEXT} characters or fewer.`);
    }
  };

  // Returns the parsed number, or null if it was missing or out of range
  const checkNumber = (field, min, max, missingMessage, rangeMessage) => {
    const str = String(values[field] ?? "").trim();
    if (str === "") {
      add(field, missingMessage);
      return null;
    }
    const num = Number(str);
    if (!Number.isFinite(num) || num < min || num > max) {
      add(field, rangeMessage);
      return null;
    }
    return num;
  };

  checkText("brand", "Enter the coffee brand.");

  if (!ROAST_LEVELS.includes(values.roastLevel)) {
    add("roastLevel", "Choose a roast level.");
  }

  checkText("machine", "Enter the machine you used.");
  checkText("grinder", "Enter the grinder you used.");

  checkNumber(
    "grindSize",
    0,
    100,
    "Enter a grind size.",
    "Grind size should be between 0 and 100."
  );

  const dose = checkNumber(
    "doseIn",
    1,
    50,
    "Enter the dose in grams.",
    "Dose should be between 1 and 50 g."
  );

  if (values.extractionMs === null) {
    add("extractionTime", TIME_FORMAT_MESSAGE);
  } else if (values.extractionMs < MIN_TIME_MS) {
    add("extractionTime", "Time the shot, or enter at least 1 second.");
  } else if (values.extractionMs > MAX_TIME_MS) {
    add("extractionTime", "Extraction time should be under 3 minutes.");
  }

  const yieldGrams = checkNumber(
    "doseOut",
    1,
    150,
    "Enter the yield in grams.",
    "Yield should be between 1 and 150 g."
  );

  if (dose !== null && yieldGrams !== null) {
    const ratio = yieldGrams / dose;
    if (ratio < MIN_RATIO || ratio > MAX_RATIO) {
      add(
        "doseOut",
        `A ${formatRatio(dose, yieldGrams)} ratio looks off. Check your dose and yield.`
      );
    }
  }

  const notes = values.tasteNotes;
  if (notes.length > MAX_TAGS) {
    add("tasteNotes", `You can add up to ${MAX_TAGS} notes.`);
  } else {
    for (let i = 0; i < notes.length; i++) {
      const message = validateTag(notes[i], notes.slice(0, i));
      if (message) {
        add("tasteNotes", message);
        break;
      }
    }
  }

  if (values.observations.trim().length > MAX_OBSERVATIONS) {
    add(
      "observations",
      `Keep observations to ${MAX_OBSERVATIONS} characters or fewer.`
    );
  }

  return errors;
};

// Convert validated values into the fields stored on a brew
const toBrewFields = (values) => ({
  brand: values.brand.trim(),
  roastLevel: values.roastLevel,
  machine: values.machine.trim(),
  grinder: values.grinder.trim(),
  grindSize: Number(values.grindSize),
  doseIn: Number(values.doseIn),
  extractionTime: dateToStr(values.extractionMs),
  doseOut: Number(values.doseOut),
  tasteNotes: values.tasteNotes,
  observations: values.observations.trim(),
});

// -------------------- CARDS --------------------

const createCardButton = (label, className, type = "button") => {
  const button = document.createElement("button");
  button.type = type;
  button.classList.add("card-btn", className);
  button.textContent = label;
  return button;
};

const createStat = (label, value) => {
  const stat = document.createElement("div");
  stat.className = "stat";
  const dt = document.createElement("dt");
  dt.textContent = label;
  const dd = document.createElement("dd");
  dd.textContent = value;
  stat.append(dt, dd);
  return stat;
};

const formatGrams = (value) =>
  Number.isFinite(Number(value)) && value !== "" && value != null
    ? `${value} g`
    : "—";

// Brews matching the applied filters, in the chosen order
const getVisibleBrews = () => {
  const { roastLevel, sort, tags } = activeFilters;

  const visible = brewLog.filter((brew) => {
    const notes = brew.tasteNotes.map((note) => note.toLowerCase());
    return (
      (!roastLevel || brew.roastLevel === roastLevel) &&
      tags.every((tag) => notes.includes(tag))
    );
  });

  // ids are creation timestamps
  return visible.sort((a, b) => (sort === "Oldest" ? a.id - b.id : b.id - a.id));
};

// Build the read-only card for a brew (all user text goes through textContent)
const createBrewCard = (brew) => {
  const card = document.createElement("article");
  card.className = "brew-card";
  card.dataset.roast = String(brew.roastLevel || "").toLowerCase();

  const header = document.createElement("header");
  header.className = "card-header";

  const heading = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = brew.brand || "Untitled brew";

  const date = document.createElement("p");
  date.className = "card-date";
  const time = document.createElement("time");
  const brewedAt = new Date(brew.id);
  time.dateTime = brewedAt.toISOString();
  time.textContent = brewedAt.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  date.appendChild(time);
  heading.append(title, date);
  header.appendChild(heading);

  if (brew.roastLevel) {
    const badge = document.createElement("span");
    badge.className = "roast-badge";
    badge.textContent = brew.roastLevel;
    header.appendChild(badge);
  }
  card.appendChild(header);

  const gearParts = [
    brew.machine,
    brew.grinder,
    brew.grindSize != null && brew.grindSize !== "" && `Grind ${brew.grindSize}`,
  ].filter(Boolean);
  if (gearParts.length) {
    const gear = document.createElement("p");
    gear.className = "card-gear";
    gear.textContent = gearParts.join(" · ");
    card.appendChild(gear);
  }

  const stats = document.createElement("dl");
  stats.className = "card-stats";
  stats.append(
    createStat("Dose", formatGrams(brew.doseIn)),
    createStat("Yield", formatGrams(brew.doseOut)),
    createStat("Ratio", formatRatio(brew.doseIn, brew.doseOut)),
    createStat("Time", brew.extractionTime || "—")
  );
  card.appendChild(stats);

  if (brew.tasteNotes.length) {
    const notes = document.createElement("div");
    notes.className = "card-notes";
    brew.tasteNotes.forEach((note) => {
      const chip = document.createElement("span");
      chip.className = "note-chip";
      chip.textContent = note;
      notes.appendChild(chip);
    });
    card.appendChild(notes);
  }

  if (brew.observations) {
    const obs = document.createElement("p");
    obs.className = "card-observations";
    obs.textContent = brew.observations;
    card.appendChild(obs);
  }

  const actions = document.createElement("div");
  actions.className = "card-actions";
  const editButton = createCardButton("Edit", "edit-btn");
  const deleteButton = createCardButton("Delete", "delete-btn");
  const label = brew.brand || "this";
  editButton.setAttribute("aria-label", `Edit ${label} brew`);
  deleteButton.setAttribute("aria-label", `Delete ${label} brew`);
  actions.append(editButton, deleteButton);
  card.appendChild(actions);

  editButton.addEventListener("click", () => {
    if (editingCard) return; // one edit at a time
    openEditor(card, brew);
  });
  deleteButton.addEventListener("click", () => cardDelete(brew.id));

  return card;
};

// Fields shown in the inline edit form
const EDIT_FIELDS = [
  { name: "brand", label: "Brand", type: "text", maxLength: MAX_TEXT },
  { name: "roastLevel", label: "Roast level", type: "select" },
  { name: "machine", label: "Machine", type: "text", maxLength: MAX_TEXT },
  { name: "grinder", label: "Grinder", type: "text", maxLength: MAX_TEXT },
  { name: "grindSize", label: "Grind size", type: "number" },
  { name: "doseIn", label: "Dose in (g)", type: "number" },
  { name: "doseOut", label: "Yield (g)", type: "number" },
  {
    name: "extractionTime",
    label: "Time",
    type: "text",
    placeholder: "00:28.50",
  },
  {
    name: "tasteNotes",
    label: "Tasting notes",
    type: "text",
    placeholder: "chocolate, cherry",
  },
  {
    name: "observations",
    label: "Observations",
    type: "textarea",
    maxLength: MAX_OBSERVATIONS,
  },
];

// Swap a card's contents for an edit form
const openEditor = (card, brew) => {
  editingCard = card;
  card.replaceChildren();

  const editForm = document.createElement("form");
  editForm.className = "edit-form";
  editForm.noValidate = true;

  const status = document.createElement("div");
  status.className = "status-area edit-errors";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  editForm.appendChild(status);

  const inputs = {};
  EDIT_FIELDS.forEach(({ name, label, type, maxLength, placeholder }) => {
    const field = document.createElement("div");
    field.className = "edit-field";

    const id = `edit-${brew.id}-${name}`;
    const labelEl = document.createElement("label");
    labelEl.htmlFor = id;
    labelEl.textContent = label;

    let input;
    if (type === "select") {
      input = document.createElement("select");
      ROAST_LEVELS.forEach((level) => input.add(new Option(level, level)));
    } else if (type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 3;
    } else {
      input = document.createElement("input");
      input.type = type;
      if (type === "number") {
        input.step = "any";
        input.inputMode = "decimal";
      }
    }
    input.id = id;
    if (maxLength) input.maxLength = maxLength;
    if (placeholder) input.placeholder = placeholder;

    field.append(labelEl, input);
    editForm.appendChild(field);
    inputs[name] = input;
  });

  inputs.brand.value = brew.brand ?? "";
  inputs.roastLevel.value = brew.roastLevel ?? "";
  inputs.machine.value = brew.machine ?? "";
  inputs.grinder.value = brew.grinder ?? "";
  inputs.grindSize.value = brew.grindSize ?? "";
  inputs.doseIn.value = brew.doseIn ?? "";
  inputs.doseOut.value = brew.doseOut ?? "";
  inputs.extractionTime.value = brew.extractionTime ?? "";
  inputs.tasteNotes.value = brew.tasteNotes.join(", ");
  inputs.observations.value = brew.observations ?? "";

  const actions = document.createElement("div");
  actions.className = "card-actions";
  const cancelButton = createCardButton("Cancel", "cancel-btn");
  actions.append(createCardButton("Save", "save-btn", "submit"), cancelButton);
  editForm.appendChild(actions);

  card.appendChild(editForm);
  watchFieldErrors(editForm, status);
  inputs.brand.focus();

  editForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearAllFieldErrors(editForm);

    const values = {
      brand: inputs.brand.value,
      roastLevel: inputs.roastLevel.value,
      machine: inputs.machine.value,
      grinder: inputs.grinder.value,
      grindSize: readNumber(inputs.grindSize),
      doseIn: readNumber(inputs.doseIn),
      extractionMs: parseTime(inputs.extractionTime.value),
      doseOut: readNumber(inputs.doseOut),
      tasteNotes: inputs.tasteNotes.value
        .split(",")
        .map(normalizeTag)
        .filter(Boolean),
      observations: inputs.observations.value,
    };

    const errors = validateBrew(values);
    if (errors.length > 0) {
      reportErrors(errors, (field) => inputs[field], status);
      return;
    }
    clearStatus(status);

    showConfirm("Save changes to this brew?", (confirmed) => {
      if (!confirmed) return;

      const previousLog = brewLog;
      const updatedBrew = { ...brew, ...toBrewFields(values) };
      brewLog = brewLog.map((entry) =>
        entry.id === brew.id ? updatedBrew : entry
      );

      if (!persistBrewLog(status)) {
        brewLog = previousLog;
        return;
      }
      renderCoffeeCard();
    });
  });

  cancelButton.addEventListener("click", () => {
    showConfirm("Discard your changes?", (confirmed) => {
      if (confirmed) {
        renderCoffeeCard();
      }
    });
  });
};

// Render each saved brew as a card in the UI
const renderCoffeeCard = () => {
  brewLogContainer.replaceChildren();
  // Re-rendering discards any open edit form
  editingCard = null;

  const visibleBrews = getVisibleBrews();

  if (visibleBrews.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-state";
    emptyMessage.textContent =
      brewLog.length === 0
        ? "No brews yet. Pull your first shot and log it above."
        : "No brews match these filters.";
    brewLogContainer.appendChild(emptyMessage);
    return;
  }

  visibleBrews.forEach((brew) =>
    brewLogContainer.appendChild(createBrewCard(brew))
  );
};

const cardDelete = (id) => {
  showConfirm("Delete this brew? This can't be undone.", (confirmed) => {
    if (!confirmed) return;

    const previousLog = brewLog;
    brewLog = brewLog.filter((entry) => entry.id !== id);
    if (!persistBrewLog()) {
      brewLog = previousLog;
      return;
    }
    renderCoffeeCard();
  });
};

// -------------------- TAG INPUTS --------------------

// Wire up a tag input with autocomplete suggestions
const createTagInput = ({ input, suggestions, list, getOptions, onChange }) => {
  let tags = [];

  const hideSuggestions = () => {
    suggestions.replaceChildren();
    suggestions.style.display = "none";
  };

  const addTag = (tag) => {
    tags.push(tag);

    const span = document.createElement("span");
    span.classList.add("remove-tag");

    const text = document.createTextNode(tag);
    const button = document.createElement("button");
    button.type = "button"; // a default submit button would submit the form
    button.classList.add("remove-btn");
    button.setAttribute("aria-label", `Remove ${tag}`);
    button.textContent = "×";

    button.addEventListener("click", () => {
      span.remove();
      tags = tags.filter((t) => t !== tag);
      clearFieldError(input);
      onChange?.();
    });

    span.append(text, button);
    list.appendChild(span);

    input.value = "";
    hideSuggestions();
  };

  const removeAll = () => {
    tags = [];
    list.replaceChildren();
    input.value = "";
    clearFieldError(input);
  };

  // Returns an error message if the tag was rejected
  const tryAddTag = (raw) => {
    const tag = normalizeTag(raw);
    if (!tag) return null;

    const error = validateTag(tag, tags);
    if (error) {
      setFieldError(input, error);
      return error;
    }
    clearFieldError(input);
    addTag(tag);
    onChange?.();
    return null;
  };

  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    tryAddTag(input.value);
  });

  input.addEventListener("input", () => {
    clearFieldError(input);
    suggestions.replaceChildren();
    const userInput = normalizeTag(input.value);

    const matches = userInput
      ? getOptions()
          .filter((note) => note.includes(userInput) && !tags.includes(note))
          .slice(0, 8)
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
      li.addEventListener("click", () => tryAddTag(note));
      suggestions.appendChild(li);
    });
  });

  input.addEventListener("blur", () => {
    setTimeout(hideSuggestions, 150);
  });

  return {
    getTags: () => [...tags],
    // Add anything typed but not yet entered, so it isn't silently dropped
    commitPending: () => tryAddTag(input.value),
    clear: removeAll,
    // Replace the tags, skipping any that wouldn't pass validation (e.g. from storage)
    set: (newTags) => {
      removeAll();
      newTags.forEach((raw) => {
        const tag = normalizeTag(String(raw));
        if (tag && !validateTag(tag, tags)) addTag(tag);
      });
    },
  };
};

// tasting Notes Input
const tastingNotes = createTagInput({
  input: tastingNotesInput,
  suggestions: tastingSuggestions,
  list: tagList,
  getOptions: () => commonEspressoTastingNotes,
  onChange: () => saveDraft(),
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
        brew.tasteNotes.map((note) => note.toLowerCase())
      ),
    ]),
  ],
});

// Put the filter controls in line with a set of filters
const showFilters = ({ roastLevel, sort, tags }) => {
  filterRoast.value = roastLevel;
  filterTime.value = sort;
  filterTastingNotes.set(tags);
};

const applyFilters = (filters) => {
  activeFilters = filters;
  writeStorage("filters", activeFilters);
  renderCoffeeCard();
};

// Only trust stored filters that the controls could have produced
const readSavedFilters = () => {
  const saved = readStorage("filters", null);
  if (!saved || typeof saved !== "object") return null;

  return {
    roastLevel: ROAST_LEVELS.includes(saved.roastLevel) ? saved.roastLevel : "",
    sort: saved.sort === "Oldest" ? "Oldest" : "",
    tags: Array.isArray(saved.tags)
      ? saved.tags.filter((tag) => typeof tag === "string")
      : [],
  };
};

applyFiltersButton.addEventListener("click", () => {
  if (filterTastingNotes.commitPending()) return;

  applyFilters({
    roastLevel: filterRoast.value,
    sort: filterTime.value,
    tags: filterTastingNotes.getTags(),
  });
});

resetFiltersButton.addEventListener("click", () => {
  const cleared = { roastLevel: "", sort: "", tags: [] };
  showFilters(cleared);
  applyFilters(cleared);
});

// -------------------- DRAFT --------------------

const DRAFT_TEXT_FIELDS = [
  "brand",
  "roastLevel",
  "machine",
  "grinder",
  "grindSize",
  "doseIn",
  "doseOut",
  "observations",
];

// Keep the unfinished form so a refresh or closed tab doesn't lose it
const saveDraft = () => {
  const draft = { tasteNotes: tastingNotes.getTags() };
  DRAFT_TEXT_FIELDS.forEach((key) => {
    draft[key] = formFields[key].value;
  });
  // Mid-shot times are meaningless after a reload, so only keep a stopped time
  if (!timerState.isRunning && parseTime(extractionTimeDisplay.value)) {
    draft.extractionTime = extractionTimeDisplay.value;
  }

  const hasContent =
    draft.tasteNotes.length > 0 ||
    draft.extractionTime ||
    ["grindSize", "doseIn", "doseOut", "observations"].some(
      (key) => draft[key].trim() !== ""
    );

  if (hasContent) {
    writeStorage("draft", draft);
  } else {
    clearDraft();
  }
};

const clearDraft = () => {
  try {
    localStorage.removeItem("draft");
  } catch {
    // Storage unavailable: nothing to clear
  }
};

// Returns true if a draft was put back into the form
const restoreDraft = () => {
  const draft = readStorage("draft", null);
  if (!draft || typeof draft !== "object") return false;

  DRAFT_TEXT_FIELDS.forEach((key) => {
    if (typeof draft[key] === "string" && draft[key] !== "") {
      formFields[key].value = draft[key];
    }
  });
  if (!ROAST_LEVELS.includes(roastLevel.value)) roastLevel.value = "";
  const draftMs =
    typeof draft.extractionTime === "string"
      ? parseTime(draft.extractionTime)
      : null;
  if (draftMs !== null) extractionTimeDisplay.value = dateToStr(draftMs);
  if (Array.isArray(draft.tasteNotes)) tastingNotes.set(draft.tasteNotes);

  updateRatioPreview();
  return true;
};

form.addEventListener("input", saveDraft);
form.addEventListener("change", saveDraft);

// -------------------- SAVE --------------------

// Fill the brand/roast/machine/grinder fields from saved preferences
const applyPreferences = (preferences) => {
  if (!preferences || typeof preferences !== "object") return;

  ["brand", "machine", "grinder"].forEach((key) => {
    if (typeof preferences[key] === "string") {
      formFields[key].value = preferences[key];
    }
  });
  if (ROAST_LEVELS.includes(preferences.roastLevel)) {
    roastLevel.value = preferences.roastLevel;
  }
};

// Reset form inputs, tags and timer
const resetForm = () => {
  form.reset();
  resetTimer();
  tastingNotes.clear();
  clearAllFieldErrors(form);
  updateRatioPreview();
};

// Handle form submit: validate, log, render
const saveCoffeeLog = (event) => {
  event.preventDefault();
  if (timerState.isRunning) stopTimer();
  clearAllFieldErrors(form);

  const pendingTagError = tastingNotes.commitPending();

  const values = {
    brand: brand.value,
    roastLevel: roastLevel.value,
    machine: machine.value,
    grinder: grinder.value,
    grindSize: readNumber(grindSize),
    doseIn: readNumber(doseIn),
    extractionMs: parseTime(extractionTimeDisplay.value),
    doseOut: readNumber(doseOut),
    tasteNotes: tastingNotes.getTags(),
    observations: observations.value,
  };

  const errors = validateBrew(values);
  if (pendingTagError && !errors.some(({ field }) => field === "tasteNotes")) {
    errors.push({ field: "tasteNotes", message: pendingTagError });
  }
  if (errors.length > 0) {
    reportErrors(errors, (field) => formFields[field], statusArea);
    return;
  }

  // Create a new brew entry object and save it
  const coffeeBrew = { id: Date.now(), ...toBrewFields(values) };
  brewLog.unshift(coffeeBrew);
  if (!persistBrewLog()) {
    brewLog.shift();
    return;
  }

  // last used fields for loading in
  const lastUsed = {
    brand: coffeeBrew.brand,
    roastLevel: coffeeBrew.roastLevel,
    machine: coffeeBrew.machine,
    grinder: coffeeBrew.grinder,
  };
  writeStorage("lastUsed", lastUsed);

  // render card and clear form, display save message
  renderCoffeeCard();
  resetForm();
  applyPreferences(lastUsed);
  clearDraft();
  setStatus(statusArea, "success", "Brew saved.");
};

// -------------------- EXPORT / IMPORT --------------------

const EXPORT_APP_NAME = "espresso-plus-plus";
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

const exportBrews = () => {
  if (brewLog.length === 0) {
    setStatus(libraryStatus, "error", "No brews to export yet.");
    return;
  }

  const data = {
    app: EXPORT_APP_NAME,
    version: 1,
    exportedAt: new Date().toISOString(),
    brews: brewLog,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `espresso-brews-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);

  const count = brewLog.length;
  setStatus(
    libraryStatus,
    "success",
    `Exported ${count} brew${count === 1 ? "" : "s"}.`
  );
};

// Run an imported entry through the same checks as the form; null if unusable
const normalizeImportedBrew = (raw) => {
  if (!raw || typeof raw !== "object" || !Number.isFinite(raw.id)) return null;

  const tasteNotes = Array.isArray(raw.tasteNotes)
    ? raw.tasteNotes.map((note) => normalizeTag(String(note)))
    : [];
  const values = {
    brand: String(raw.brand ?? ""),
    roastLevel: raw.roastLevel,
    machine: String(raw.machine ?? ""),
    grinder: String(raw.grinder ?? ""),
    grindSize: raw.grindSize,
    doseIn: raw.doseIn,
    extractionMs: parseTime(String(raw.extractionTime ?? "")),
    doseOut: raw.doseOut,
    tasteNotes,
    observations: String(raw.observations ?? ""),
  };

  if (validateBrew(values).length > 0) return null;
  return { id: raw.id, ...toBrewFields(values) };
};

const importBrews = async (file) => {
  if (file.size > MAX_IMPORT_BYTES) {
    setStatus(libraryStatus, "error", "That file is too large to be a brew export.");
    return;
  }

  let entries;
  try {
    const data = JSON.parse(await file.text());
    entries = Array.isArray(data) ? data : data?.brews;
    if (!Array.isArray(entries)) throw new Error("No brews array");
  } catch {
    setStatus(libraryStatus, "error", "That file isn't a valid brew export.");
    return;
  }

  const existingIds = new Set(brewLog.map((brew) => brew.id));
  const added = [];
  let invalid = 0;

  entries.forEach((entry) => {
    const brew = normalizeImportedBrew(entry);
    if (!brew) {
      invalid++;
    } else if (!existingIds.has(brew.id)) {
      existingIds.add(brew.id);
      added.push(brew);
    }
  });

  if (added.length === 0) {
    const reason = invalid > 0
      ? "That file has no valid brews to import."
      : "Nothing new to import. Those brews are already saved.";
    setStatus(libraryStatus, "error", reason);
    return;
  }

  const previous = brewLog;
  brewLog = [...brewLog, ...added].sort((a, b) => b.id - a.id);
  if (!persistBrewLog(libraryStatus)) {
    brewLog = previous;
    return;
  }

  renderCoffeeCard();
  let message = `Imported ${added.length} brew${added.length === 1 ? "" : "s"}.`;
  if (invalid > 0) {
    message += ` Skipped ${invalid} that ${invalid === 1 ? "wasn't" : "weren't"} valid.`;
  }
  setStatus(libraryStatus, "success", message);
};

exportButton.addEventListener("click", exportBrews);
importButton.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", async () => {
  const [file] = importFile.files;
  if (file) await importBrews(file);
  // Clear so picking the same file again still fires "change"
  importFile.value = "";
});

// -------------------- LOAD --------------------

// load from local storage, skipping anything that isn't a usable brew
const loadSavedBrewsFromLocalStorage = () => {
  const stored = readStorage("brewLog", []);

  brewLog = (Array.isArray(stored) ? stored : [])
    .filter(
      (brew) => brew && typeof brew === "object" && Number.isFinite(brew.id)
    )
    .map((brew) => ({
      ...brew,
      tasteNotes: Array.isArray(brew.tasteNotes)
        ? brew.tasteNotes.filter((note) => typeof note === "string")
        : [],
    }));

  // Put back the filters from last visit, keeping only tags that still validate
  const savedFilters = readSavedFilters();
  if (savedFilters) {
    showFilters(savedFilters);
    activeFilters = { ...savedFilters, tags: filterTastingNotes.getTags() };
  }

  renderCoffeeCard();
  applyPreferences(readStorage("lastUsed", null));
  if (restoreDraft()) {
    setStatus(statusArea, "success", "Picked up where you left off.");
  }
};

// Load brews from local storage
loadSavedBrewsFromLocalStorage();

// Attach event listeners
startStopTimer.addEventListener("click", () => {
  if (timerState.isRunning) {
    stopTimer();
    saveDraft();
  } else {
    startTimer();
  }
});
clearTimer.addEventListener("click", () => {
  resetTimer();
  saveDraft();
});
form.addEventListener("submit", saveCoffeeLog);
