# SPEED BRAIN — Complete Neon Reaction Game

> **"Think Fast. React Faster."**

A browser-based arcade mini-game combining rapid mental arithmetic, split-second decision-making, countdown pressure, and progressive neon difficulty scaling.

---

## 🎮 Game Overview

**SPEED BRAIN** tests cognitive agility and calculation reflexes. Players solve rapid mental math problems against a shrinking countdown bar, building streaks to unlock score multipliers (up to 4x Neon Overdrive) while managing lives or racing against master clocks.

### Features

- **Mental Arithmetic Engine**: Procedurally generates addition, subtraction, multiplication, division, and compound 2-step calculations with intelligent near-miss distractors.
- **Progressive Difficulty**:
  - **Casual**: 7.0s per question, relaxed mental math.
  - **Normal**: 4.5s per question, standard arithmetic challenges.
  - **Pro Speed**: 3.0s per question, compound calculations, tight reaction windows.
- **Three Game Modes**:
  - **Classic (3 Lives)**: Survive as long as you can; 3 mistakes or timeouts and the run ends.
  - **60s Blitz Sprint**: Answer as many questions as possible before the master clock runs out.
  - **Zen Practice**: Unlimited time per problem for warm-up and speed training.
- **Streak & Multiplier System**:
  - 3+ Streak: **1.5x Multiplier**
  - 6+ Streak: **2.0x Multiplier (Surge)**
  - 10+ Streak: **3.0x Multiplier**
  - 15+ Streak: **4.0x Multiplier (Neon Overdrive)**
- **Web Audio API Sound Engine**: Zero external audio files; all chimes, clicks, countdown chirps, victory fanfares, and buzzers are synthesized in real-time.
- **High Scores & Lifetime Records**: LocalStorage persistence saves personal records across each difficulty and mode, lifetime best streaks, and total games played.
- **Full Keyboard & Touch Support**: Play with keys `1`, `2`, `3`, `4` (or `NumPad`, `A`, `B`, `C`, `D`), `Space` to start/replay, `Esc` to pause, or touch/mouse on mobile and desktop.
- **Futuristic Neon Visuals**: Dynamic ambient particle canvas, radial glows, and WCAG AA accessible contrast, respecting `prefers-reduced-motion`.

---

## 🚀 How to Run

1. Open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Safari).
2. No installation, command line, build tools, or web server required.
3. Completely offline-capable.

---

## 📁 File Structure

```text
speed-brain/
├── index.html   # Main HTML5 structure and markup
├── style.css    # Cyber-neon styling, CSS variables, animations, and responsive layout
├── script.js    # State machine, math generator, Web Audio synthesis, and local storage
└── README.md    # Documentation and instructions
```

---

## ⌨️ Controls & Shortcuts

| Action | Keyboard Key | Mouse / Touch |
| :--- | :--- | :--- |
| Select Answer 1 | `1` or `A` or `NumPad 1` | Tap Button 1 |
| Select Answer 2 | `2` or `B` or `NumPad 2` | Tap Button 2 |
| Select Answer 3 | `3` or `C` or `NumPad 3` | Tap Button 3 |
| Select Answer 4 | `4` or `D` or `NumPad 4` | Tap Button 4 |
| Start / Play Again | `Space` | Click Play Button |
| Pause / Resume | `Escape` | Click Pause Button |
