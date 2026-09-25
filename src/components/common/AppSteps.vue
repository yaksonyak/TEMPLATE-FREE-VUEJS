<!-- src/components/common/AppSteps.vue
     Indicateur d'étapes pour les formulaires multi-écrans (inscription, candidature…).
     Purement visuel : la navigation (précédent/suivant) reste gérée par la page,
     ce composant se contente d'afficher où en est l'utilisateur. -->
<template>
  <ol class="flex items-start w-full">
    <li v-for="(titre, index) in etapes" :key="titre" class="flex items-center" :class="index === etapes.length - 1 ? '' : 'flex-1'">
      <div class="flex flex-col items-center gap-1.5 text-center w-20 shrink-0">
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors"
          :class="classeCercle(index + 1)"
        >
          <svg v-if="index + 1 < actuelle" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
          </svg>
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span class="text-xs leading-tight" :class="index + 1 === actuelle ? 'text-cnece-primary font-semibold' : 'text-slate-500 font-medium'">
          {{ titre }}
        </span>
      </div>
      <div v-if="index < etapes.length - 1" class="h-0.5 flex-1 mx-1 mt-4 rounded transition-colors" :class="index + 1 < actuelle ? 'bg-cnece-primary' : 'bg-slate-200'" />
    </li>
  </ol>
</template>

<script>
export default {
  name: 'AppSteps',
  props: {
    etapes: { type: Array, required: true },   // titres courts, ex: ['État civil', 'Inscription']
    actuelle: { type: Number, required: true }, // étape courante (1-based)
  },
  methods: {
    classeCercle(numero) {
      if (numero < this.actuelle) return 'bg-cnece-primary text-white'
      if (numero === this.actuelle) return 'bg-cnece-primary text-white ring-4 ring-cnece-primary/20'
      return 'bg-slate-100 text-slate-400 border border-slate-300'
    },
  },
}
</script>
