<!-- src/layouts/TheHeader.vue
     Barre du haut : bouton menu (mobile), titre de la page courante,
     identité de l'utilisateur (nom, rôle, périmètre) et déconnexion. -->
<template>
  <header class="sticky top-0 z-20 bg-white border-b border-slate-200">
    <div class="flex items-center gap-4 px-4 sm:px-6 lg:px-8 h-16">
      <!-- Bouton ☰ visible uniquement sur mobile -->
      <button
        type="button"
        class="lg:hidden -ml-2 p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        aria-label="Ouvrir le menu"
        @click="$emit('ouvrir-menu')"
      >
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <!-- Titre de la page (vient de meta.titre de la route) -->
      <h1 class="text-lg font-semibold text-slate-800 truncate">
        {{ $route.meta.titre }}
      </h1>

      <div class="ml-auto flex items-center gap-3">
        <!-- Identité : nom + rôle + périmètre -->
        <div class="hidden sm:block text-right leading-tight">
          <p class="text-sm font-medium text-slate-800">{{ nomComplet }}</p>
          <p class="text-xs text-slate-500">
            <span class="inline-block rounded bg-cnece-secondary px-1.5 py-0.5 text-cnece-primary font-medium">
              {{ modeDemo ? 'Mode démo' : roleLibelle }}
            </span>
            <span class="ml-1">{{ modeDemo ? 'Données locales' : perimetreLibelle }}</span>
          </p>
        </div>

        <!-- Avatar : initiales -->
        <div
          class="h-9 w-9 rounded-full bg-cnece-primary text-white flex items-center justify-center text-sm font-semibold"
          :title="nomComplet"
          aria-hidden="true"
        >
          {{ initiales }}
        </div>

        <button
          type="button"
          class="btn-danger text-sm"
          :disabled="chargement"
          @click="seDeconnecter"
        >
          Déconnexion
        </button>
      </div>
    </div>
  </header>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'

const MODE_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

export default {
  name: 'TheHeader',
  emits: ['ouvrir-menu'],
  computed: {
    ...mapState(useAuthStore, ['nomComplet', 'roleLibelle', 'perimetreLibelle', 'chargement']),
    modeDemo: () => MODE_DEMO,

    /** « Fatoumata Traoré » → « FT » */
    initiales() {
      return this.nomComplet
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((mot) => mot[0].toUpperCase())
        .join('')
    },
  },
  methods: {
    ...mapActions(useAuthStore, ['logout']),
    async seDeconnecter() {
      await this.logout()
      this.$router.replace({ name: 'connexion' })
    },
  },
}
</script>
