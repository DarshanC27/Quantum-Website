# AGENTS.md

## Cursor Cloud specific instructions

### Product
Static **Quantum Ready** marketing site (no React/framework). Primary pages: `index.html` (multi-file + `assets/`), `immersive.html` (single-file immersive), `lab/` (design experiments), `standalone.html` (inlined deployable).

### Commands
See `README.md` / `package.json`: `npm run dev`, `npm run lint`, `npm run test`, `npm run build`, `npm run standalone`.

### Non-obvious notes
- Dev server is Vite serving static HTML on `0.0.0.0:5173` (`vite.config.js`) — required for Cloud Agent Desktop access.
- Edit `index.html` / `assets/*` as source of truth, then run `npm run standalone` before relying on `standalone.html`.
- Core interactive demo: Mosca calculator (`#calculator`) — change sector/sliders and confirm the verdict updates; contact form (`#contact`) requests a free domain scan (opens mailto when `CONTACT.email` is set in `assets/app.js`).
- `immersive.html` is a separate single-file experience (boot loader + 3D fridge canvas); do not expect it to share `assets/app.js`. Linked from main nav.
- Deploy: GitHub Actions workflow `.github/workflows/pages.yml` publishes on push to `main` once the repo owner sets Pages Source to **GitHub Actions**.
- Lint is **oxlint** over `assets/` and `lab/` only. Tests are Node's built-in test runner on the Mosca formula mirror in `tests/mosca.mjs`.
