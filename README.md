<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0e27,100:6e40c9&height=200&section=header&text=Quantum%20Ready&fontSize=56&fontColor=00ff9f&fontAlignY=36&desc=Company%20website&descSize=17&descAlignY=58&animation=fadeIn" alt="Quantum Ready"/>

**The public website of Quantum Ready — post-quantum readiness for UK firms that keep secrets for decades.**

<a href="https://darshanc27.github.io/Quantum-Website/"><img src="https://img.shields.io/badge/Live-site-00ff9f?style=for-the-badge&labelColor=0a0e27&logo=githubpages&logoColor=white" alt="Live site"/></a>
<img src="https://img.shields.io/badge/Vite-static-646cff?style=for-the-badge&labelColor=0a0e27&logo=vite&logoColor=white" alt="Vite"/>
<img src="https://img.shields.io/badge/Lint-oxlint-f0db4f?style=for-the-badge&labelColor=0a0e27" alt="oxlint"/>
<img src="https://img.shields.io/badge/Licence-MIT-16213e?style=for-the-badge&labelColor=0a0e27" alt="MIT"/>

[▶ Visit the site](https://darshanc27.github.io/Quantum-Website/) · [Immersive page](https://darshanc27.github.io/Quantum-Website/immersive.html) · [Design lab](https://darshanc27.github.io/Quantum-Website/lab/)

</div>

---

## Pages

| Page | What it is |
|---|---|
| [`index.html`](index.html) | Main site: Mosca risk calculator, services, team and a free-scan request form |
| [`immersive.html`](immersive.html) | Cinematic single-file experience with a 3D dilution refrigerator |
| [`standalone.html`](standalone.html) | The main site inlined into one file, for email and offline demos |
| [`lab/`](lab) | Eight visual-direction experiments (brutalist, chrome, editorial, generative, terminal, clay, Swiss glitch, kinetic) |
| [`focus/`](focus) | Focus Sanctuary: a 3D study companion with soundscapes, installable as a PWA |

## The Mosca calculator

The headline interaction answers one question: *will your data still need to be secret when a quantum computer can read it?*

```
exposed  ⇔  shelf-life of the data  +  time to migrate  >  years until a cryptographically relevant quantum computer
```

Pick a sector, adjust the sliders, and the verdict flips between **Exposed** and **Within tolerance**. The formula is mirrored in [`tests/mosca.mjs`](tests/mosca.mjs) and covered by Node's built-in test runner.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
npm run lint         # oxlint over assets/, lab/ and focus/
npm test             # Mosca formula tests
npm run standalone   # rebuild standalone.html after editing index.html or assets/
```

Edit `index.html` and `assets/` as the source of truth; `standalone.html` is generated.

## Deploy

Every push to `main` publishes to GitHub Pages through [`.github/workflows/pages.yml`](.github/workflows/pages.yml).
The site is fully static, so it also deploys unchanged to Vercel or Netlify.

## Contact form

The free-scan form opens a pre-filled email by default. To collect requests server-side, set
`CONTACT.formEndpoint` in [`assets/app.js`](assets/app.js) to a Formspree (or similar) endpoint and run `npm run standalone`.

---

<div align="center"><sub>© 2026 Quantum Ready Ltd · Guildford, United Kingdom</sub></div>
