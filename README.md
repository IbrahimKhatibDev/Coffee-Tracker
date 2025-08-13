# Espresso++

A work-in-progress web app for tracking espresso brews, extraction times, tasting notes, and brewing parameters — with a focus on **ease of use**, **personalization**, and **local data storage**.

The app lets you log your coffee brews, track extraction timers, save brewing parameters for reuse, and filter/search past brews. All data is stored in your browser’s **Local Storage**, so no server or account setup is required.

---

## 🚀 Features (Current)

- **Add and Save Coffee Brews**
  - Brand, roast level, machine, grinder, grind size
  - Dose in/out (grams), extraction time
  - Tasting notes with autocomplete suggestions
  - Additional observations/notes

- **Timer Functionality**
  - Start/stop extraction timer
  - Manual time entry with validation
  - Clear/reset timer

- **Edit & Delete Saved Brews**
  - Inline editing with confirmation modals
  - Cancel edit confirmation
  - Data updated in Local Storage

- **Filtering and Sorting**
  - Filter by roast level
  - Sort by newest/oldest
  - Filter by tasting notes
  - Collapsible filter panel

- **Dark Mode**
  - Toggle with persistent theme preference

- **Persistent Preferences**
  - Saves last-used brand, roast level, machine, and grinder

- **Validation & Error Handling**
  - Highlights invalid inputs
  - Displays error/success messages

---

## 🛠 Tech Stack

- **HTML5** for structure
- **CSS3** (vanilla, responsive, with CSS variables for theme)
- **JavaScript (ES6+)**
  - DOM manipulation
  - Event handling
  - Local Storage API

---

## 📂 Project Structure

├── index.html # Main HTML structure

├── styles.css # Theme, layout, and component styles

├── app.js # App logic and event handling

└── README.md # Project documentation


---

## 💻 Getting Started

1. **Clone or Download**
   ```bash
   git clone https://github.com/your-username/espresso-plus-plus.git
   cd espresso-plus-plus
   
2. **Open in Browser**
   - Open `index.html` in your preferred browser — no build process required.

---

## 📌 Roadmap (Planned Features)

- **Image Uploads**
  - Add optional photo per brew
- **Advanced Filtering**
  - Multiple criteria at once
- **Bulk Delete**
  - Select multiple brews to remove
- **Improved Mobile UI**
  - More touch-friendly controls
- **Export/Import**
  - Backup or transfer brew logs
- **React Rebuild**
  - Long-term goal to rebuild with backend support

---

## 🐛 Known Issues

- Tag/tasting note autocomplete may overlap inputs on smaller screens
- Input field spacing could be improved in edit mode
- Validation messages not yet localized
- No confirmation for “Clear” timer action

---

## 📜 License

MIT License — free to use, modify, and distribute.
