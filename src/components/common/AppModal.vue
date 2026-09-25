<!-- src/components/common/AppModal.vue
     Fenêtre modale générique. <Teleport to="body"> la sort du flux de la page
     pour qu'elle passe au-dessus de tout. Se ferme avec Échap ou un clic sur le voile. -->
<template>
  <Teleport to="body">
    <div
      v-if="ouvert"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="idTitre"
      @keydown.esc="$emit('fermer')"
    >
      <!-- Voile -->
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="$emit('fermer')" />

      <!-- Boîte -->
      <div class="relative w-full bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 flex flex-col max-h-[90vh] animate-fade-in" :class="classeTaille">
        <header class="flex items-center justify-between gap-3 px-5 py-4 border-b-2 border-cnece-primary/20 bg-gradient-to-r from-slate-50 to-white rounded-t-2xl">
          <h2 :id="idTitre" class="text-lg font-semibold text-cnece-primary">{{ titre }}</h2>
          <button
            type="button"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Fermer"
            @click="$emit('fermer')"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div class="px-5 py-5 overflow-y-auto">
          <slot />
        </div>

        <footer v-if="$slots.pied" class="flex justify-end gap-2 px-5 py-3 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 rounded-b-2xl">
          <slot name="pied" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script>
let compteur = 0

export default {
  name: 'AppModal',
  props: {
    ouvert: { type: Boolean, default: false },
    titre: { type: String, default: '' },
    taille: { type: String, default: 'md' }, // 'sm' | 'md' | 'lg' | 'xl'
  },
  emits: ['fermer'],
  data() {
    return { idTitre: `modal-titre-${++compteur}` }
  },
  computed: {
    classeTaille() {
      return { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[this.taille]
    },
  },
  watch: {
    // Bloque le défilement de la page derrière la modale.
    ouvert(valeur) {
      document.body.style.overflow = valeur ? 'hidden' : ''
    },
  },
  beforeUnmount() {
    document.body.style.overflow = ''
  },
}
</script>
