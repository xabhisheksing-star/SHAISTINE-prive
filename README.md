# SHAÏSTINE PRIVÉ — Haute Parfumerie & Continuous Scroll Experience

An ultra-luxury, editorial Haute Parfumerie digital experience showcasing **L'EXTRAIT NOIR** through a precision 240-frame liquid inertia scroll engine, atmospheric golden foggy cursor glow, ambient Web Audio synthesis, interactive olfactive pyramid, bespoke fragrance diagnostic concierge, and luxury cart ledger.

---

## 🌟 Key Features

1. **240-Frame Interactive Cinematic Scroll Engine**:
   - High-DPI canvas cover-scaling for crisp rendering across all viewports.
   - Bound scrubbing mode (`0` to `239`) transitioning smoothly into the rest of the editorial narrative.
   - First-arrival autoplay cinematic intro with instant scroll-wheel / touch handoff.
   - Precision milestone story chapters synchronized with frame ranges (*Phase I* through *Phase IV*).

2. **Atmospheric Golden Foggy Cursor Glow & Perfume Mist Trail**:
   - Preserves crisp, non-transparent native OS cursors everywhere.
   - Multi-layered warm golden foggy halo (`#d4af37`, `#f3e5ce`, `#c5a880`) with living vapor breathing animation.
   - Fullscreen aerosol perfume mist particle system that dissipates behind mouse movement.
   - Dynamic hover expansion over interactive controls and central flacon zone.

3. **Web Audio API Ambient Soundscape**:
   - Procedural dual-oscillator drone + filtered pink/brown noise micro-atomizer puff synthesis.
   - Dynamically swells in pitch and resonance as the bottle pirouettes through frames.

4. **Haute Horlogerie & Parfumerie Editorial Sections**:
   - **The Atelier Vessel Story**: Deep crystal anatomy and French artisanal craft notes.
   - **Interactive Olfactive Pyramid**: Exploration of Top, Heart, and Base notes with raw material origin dossiers.
   - **Haute Collection**: Numbered vintage bottle cards with volumetric specs, price cards, and interactive purchase ledger.
   - **Bespoke Diagnostic Concierge**: 3-question private recommendation quiz matching user temperament to bespoke allocations.
   - **Cart Drawer & Checkout System**: Real-time sliding drawer, order accounting, and secure simulated checkout.

---

## 🚀 One-Click Deploy to Vercel

This repository is optimized for instant zero-configuration deployment on [Vercel](https://vercel.com):

1. **Fork or Import** this repository into your Vercel Dashboard.
2. **Framework Preset**: Select `Other` (or leave default as auto-detected static).
3. **Build Command**: Leave empty or default (`echo 'Static assets ready for deployment'`).
4. **Output Directory**: Leave empty (root `./`).
5. Click **Deploy**.

Vercel will deploy globally across its Edge Network with the included [`vercel.json`](./vercel.json) caching rules for maximum performance on all 240 high-resolution frames.

---

## 💻 Local Development

You can run this project locally using any static web server:

```bash
# Using Node.js npx serve
npx serve .

# Using Python
python -m http.server 8080

# Using PowerShell .NET server
powershell -ExecutionPolicy Bypass -File server.ps1 -Port 8080
```

Then open `http://localhost:8080/` in your browser.

---

## 📁 Repository Structure

```
├── assets/                  # Brand imagery, luxury cards, and iconography
├── css/
│   └── styles.css           # Complete luxury design system & responsive layout
├── hero section/            # 240 continuous frames (ezgif-frame-001.jpg - 240.jpg)
├── js/
│   └── script.js            # Frame preloader, physics loop, cursor mist & UI logic
├── index.html               # Main semantic HTML5 markup
├── package.json             # NPM metadata and convenience scripts
├── vercel.json              # Vercel Edge caching and routing configuration
└── README.md                # Documentation and deployment guide
```

---

&copy; 2026 SHAÏSTINE PRIVÉ MAISON DE HAUTE PARFUMERIE. ALL RIGHTS RESERVED.
