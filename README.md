# Quantum Ready — company website

This is the marketing website for **Quantum Ready**, a UK startup helping organisations prepare for post-quantum cryptography (NCSC 2035).

## What you already have

| Page | Purpose |
|------|---------|
| `index.html` | Main company website (calculator, services, team, free-scan form) |
| `immersive.html` | Cinematic single-file experience (3D dilution fridge) |
| `standalone.html` | One-file copy of the main site (for email / offline demos) |
| `lab/` | Design experiments — not for customers |

Local preview: `npm install` then `npm run dev` → http://localhost:5173

## How to put it live (you — 3 steps)

The code is ready. Publishing needs **one click from you** because GitHub must authorise Pages on your account.

### Option A — GitHub Pages (free, already wired)

1. Open the repo: https://github.com/DarshanC27/Quantum-Website
2. **Settings → Pages**
3. Under **Build and deployment**, set Source to **GitHub Actions**
4. Merge the launch PR (or push to `main`) — the workflow `.github/workflows/pages.yml` deploys automatically
5. Your live URL will be: **https://darshanc27.github.io/Quantum-Website/**

### Option B — Vercel (custom domain friendly)

1. Authenticate the Vercel integration in Cursor when prompted
2. Ask the agent: “Deploy Quantum Ready to Vercel”
3. Point your domain (e.g. `quantumready.co.uk`) at the Vercel project

## Connect the free-scan form (recommended)

Today the form opens your email (`mailto:`). To collect leads properly:

1. Create a free form at [Formspree](https://formspree.io) (or Netlify Forms)
2. Put the endpoint URL in `assets/app.js`:

```js
var CONTACT = {
  email: "darshanchabbi271@gmail.com",
  formEndpoint: "https://formspree.io/f/YOUR_ID"  // ← add this
};
```

3. Run `npm run standalone` so `standalone.html` stays in sync

## What the agent already verified

- Lint clean, Mosca calculator tests pass
- Calculator works (sector → Exposed / Within tolerance)
- Free-scan form submits
- Immersive page boots and renders
