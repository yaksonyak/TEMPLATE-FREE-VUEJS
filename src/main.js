// src/main.js
// Point d'entrée : crée l'application Vue, branche Pinia (état global) PUIS le router
// (la garde du router utilise le store auth, donc Pinia doit être installé avant),
// et monte le tout dans la <div id="app"> de index.html.
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import composantsCommuns from './components/index.js'
import './assets/main.css' // Tailwind + thème du portail

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(composantsCommuns) // <AppTable>, <AppButton>… disponibles partout

app.mount('#app')
