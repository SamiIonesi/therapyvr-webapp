# TherapyVR — WebApp Terapeut

## Instalare si rulare locala

```bash
# 1. Instaleaza dependentele (o singura data)
npm install

# 2. Porneste serverul local (http://localhost:3000)
npm run dev
```

## Build pentru hosting (Netlify/Vercel)

```bash
# Genereaza folderul dist/
npm run build

# Testeaza build-ul local inainte de deploy
npm run preview
```

## Deploy pe Netlify

**Varianta 1 — Drag & Drop:**
1. Ruleaza `npm run build`
2. Mergi pe netlify.com
3. Drag & drop folderul `dist/`

**Varianta 2 — GitHub (recomandat):**
1. Push repo pe GitHub
2. Netlify → New site from Git → selecteaza repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. La fiecare `git push`, Netlify rebuildeaza automat

## Structura proiect

```
therapyvr/
├── index.html          # HTML principal
├── css/main.css        # Toate stilurile
├── js/
│   ├── config.js       # Configurare Firebase
│   ├── utils.js        # U (utilitare), ICONS
│   ├── services.js     # Servicii Firebase
│   ├── app.js          # App principal + initializare
│   ├── core/           # Timer, UI, Router, Page
│   ├── data/           # METRIC_INFO
│   ├── shapes/         # Geometrii 3D + preview
│   └── pages/          # O pagina per fisier
├── package.json
└── vite.config.js
```
