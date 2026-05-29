import { defineConfig } from 'vite'

export default defineConfig({
  // Serveste din radacina proiectului
  root: '.',
  build: {
    outDir: 'dist',
    // Pastreaza structura de fisiere in dist/
    assetsDir: 'assets'
  },
  server: {
    port: 3000,
    open: true  // Deschide browserul automat la npm run dev
  }
})
