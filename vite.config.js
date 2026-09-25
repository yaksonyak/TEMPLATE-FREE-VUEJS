// vite.config.js
// Configuration de Vite : le bundler qui sert l'application en développement
// (npm run dev) et la compile pour la production (npm run build).
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'          // Permet à Vite de comprendre les fichiers .vue
import tailwindcss from '@tailwindcss/vite'  // Plugin officiel Tailwind CSS v4 (remplace tailwind.config.js)

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Permet d'écrire  import X from '@/services/api.js'
      // au lieu de       import X from '../../services/api.js'
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: true, // Ouvre le navigateur automatiquement au lancement
  },
  build: {
    // SheetJS (xlsx) pèse ~500 ko à lui seul mais n'est chargé qu'au clic sur « Exporter Excel »
    // (import() dynamique dans utils/export.js) : on relève le seuil d'avertissement en conséquence.
    chunkSizeWarningLimit: 600,
  },
})
