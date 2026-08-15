import { defineConfig } from 'vite'

// Static multi-page site. Vite is the local file server (and optional preview).
// Production deploy is the HTML/CSS/JS as-is (GitHub Pages); `npm run build`
// regenerates standalone.html from the multi-file sources.
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
})
