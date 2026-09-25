<!-- src/components/common/MatriculeBadge.vue
     Affiche un matricule national (AAEECCNNNL) en police monospace.
     Un clic copie la valeur dans le presse-papiers. -->
<template>
  <button
    v-if="matricule"
    type="button"
    class="matricule-badge cursor-pointer hover:bg-slate-200 transition-colors"
    :title="copie ? 'Copié !' : 'Cliquer pour copier'"
    @click="copier"
  >
    {{ matricule }}
    <span v-if="copie" class="ml-1 text-cnece-accent" aria-live="polite">✓</span>
  </button>
  <span v-else class="text-slate-400 text-xs">—</span>
</template>

<script>
export default {
  name: 'MatriculeBadge',
  props: {
    matricule: { type: String, default: '' },
  },
  data() {
    return { copie: false }
  },
  methods: {
    async copier() {
      try {
        await navigator.clipboard.writeText(this.matricule)
        this.copie = true
        setTimeout(() => (this.copie = false), 1500)
      } catch {
        // Presse-papiers indisponible (http non sécurisé…) : on ignore silencieusement
      }
    },
  },
}
</script>
