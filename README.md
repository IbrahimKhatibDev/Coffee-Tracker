# Espresso++

A web app for tracking espresso brews, extraction times, tasting notes, and brewing parameters, with a focus on **ease of use**, **personalization**, and **local data storage**.

The app lets you log your coffee brews, time extractions, reuse your usual setup, and filter past brews. All data is stored in your browser (**Local Storage**, with photos in **IndexedDB**), so no server or account setup is required.

**Live at [espressotracker.vercel.app](https://espressotracker.vercel.app)**

---

## Features

- **Log Coffee Brews**
  - Brand, roast level, machine, grinder, grind size
  - Dose in/out (grams) with a live brew ratio preview
  - Tasting notes with autocomplete suggestions
  - Additional observations
  - Optional photo per brew (click, drag and drop, or take one with your phone's camera)

- **Extraction Timer**
  - Start/stop timer
  - Manual time entry (e.g. `00:28.50`) with validation
  - Clear/reset timer

- **Brew Photos**
  - Photos are resized and compressed in the browser before saving
  - On phones and tablets, a **Take photo** button opens the rear camera directly, and **Retake** replaces the current photo with a new shot
  - Shown on the right-hand side of each card; tap it to view full size
  - Replace or remove a photo while editing a brew

- **Edit & Delete Saved Brews**
  - Inline editing with the same validation as the main form
  - Confirmation modals for deleting and discarding edits
  - Bulk delete: select several brews (or all shown) and delete them at once

- **Filtering and Sorting**
  - Filter by roast level and tasting notes
  - Sort by newest/oldest
  - Applied filters are remembered between visits
  - Reset filters in one click
  - Collapsible filter panel

- **Saved Progress**
  - Unfinished forms are saved as a draft and restored on reload
  - Last-used brand, roast level, machine, and grinder are pre-filled

- **Export / Import**
  - Export all brews, including photos, to a dated JSON file
  - Import a backup; invalid entries and duplicates are skipped

- **Validation & Messaging**
  - Field-level error messages with accessible markup
  - Sanity checks on dose, yield, ratio, and extraction time
  - Clear success and error status messages

- **Coffee-Themed Design**
  - Warm coffee palette with roast-coloured brew cards
  - Dark mode with a persistent preference
  - Responsive layout and reduced-motion support

---

## Tech Stack

- **HTML5** for structure
- **CSS3** (vanilla, responsive, with CSS custom properties for theming)
- **JavaScript (ES6+)**
  - DOM manipulation
  - Event handling
  - Local Storage API
  - IndexedDB for photos

---

## Project Structure

```
├── index.html   # Main HTML structure
├── styles.css   # Theme, layout, and component styles
├── app.js       # App logic and event handling
├── favicon.svg  # Browser tab icon
└── README.md    # Project documentation
```

---

## Getting Started

1. **Clone or Download**
   ```bash
   git clone https://github.com/IbrahimKhatibDev/Coffee-Tracker.git
   cd Coffee-Tracker
   ```

2. **Open in Browser**
   - Open `index.html` in your preferred browser. No build process is required.
   - Or serve it locally, e.g. `python3 -m http.server`, and visit `http://localhost:8000`.

---

## Known Issues

- Validation messages are not yet localized
- No confirmation for the "Clear" timer action

---

## License

MIT License: free to use, modify, and distribute.
