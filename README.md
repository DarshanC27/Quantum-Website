# Quantum Ready Website

Static marketing site for **Quantum Ready** — post-quantum cryptography readiness assessments for UK organisations (NCSC 2035 deadline).

## Source of truth

- Multi-file site: `index.html` + `assets/style.css` + `assets/app.js`
- Rebuild the single-file deployable with `npm run standalone` (`python3 build-standalone.py`) → `standalone.html`
- Alternate immersive single-file build: `immersive.html`
- Design lab explorations: `lab/`

## Commands

```bash
npm install
npm run dev          # http://localhost:5173
npm run lint
npm run test
npm run standalone   # refresh standalone.html from multi-file sources
npm run build        # standalone + Vite static build → dist/
npm run preview
```

No backend is required for local development.
