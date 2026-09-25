<!-- src/components/common/AppIconButton.vue
     Bouton d'action compact (icône seule) pour les colonnes « Actions » des tableaux :
     évite de répéter Voir / Modifier / Supprimer en toutes lettres sur chaque ligne. -->
<template>
  <button
    type="button"
    class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    :class="CLASSES[action]"
    :title="titre"
    :aria-label="titre"
  >
    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" :d="ICONES[action]" />
    </svg>
  </button>
</template>

<script>
const ICONES = {
  voir: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  modifier: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z M19.5 15.75v3.75a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 19.5v-13.5A2.25 2.25 0 014.5 3.75h5.25',
  supprimer: 'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0',
  valider: 'M4.5 12.75l6 6 9-13.5',
  rejeter: 'M6 18L18 6M6 6l12 12',
}

const CLASSES = {
  voir: 'border-slate-300 text-slate-500 hover:bg-slate-100 hover:text-cnece-primary',
  modifier: 'border-slate-300 text-slate-500 hover:bg-cnece-secondary hover:text-cnece-primary',
  supprimer: 'border-transparent bg-cnece-danger/10 text-cnece-danger hover:bg-cnece-danger hover:text-white',
  valider: 'border-transparent bg-cnece-accent/10 text-cnece-accent hover:bg-cnece-accent hover:text-white',
  rejeter: 'border-transparent bg-cnece-danger/10 text-cnece-danger hover:bg-cnece-danger hover:text-white',
}

export default {
  name: 'AppIconButton',
  props: {
    action: { type: String, required: true, validator: (v) => Object.keys(ICONES).includes(v) },
    titre: { type: String, required: true }, // libellé accessible + info-bulle, ex. "Voir"
  },
  data() {
    return { ICONES, CLASSES }
  },
}
</script>
