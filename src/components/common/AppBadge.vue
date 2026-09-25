<!-- src/components/common/AppBadge.vue
     Pastille colorée pour une valeur d'énumération de l'API.
     La couleur est déduite automatiquement de la valeur (en_attente → ambre, valide → vert…)
     et le texte affiché vient de utils/format.js. -->
<template>
  <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" :class="classes">
    {{ texte }}
  </span>
</template>

<script>
import { libelle } from '@/utils/format.js'

// Valeur brute → couleur. Les valeurs non listées prennent le gris.
const COULEURS = {
  en_attente: 'ambre',
  redoublant: 'ambre',
  valide: 'vert',
  actif: 'vert',
  admis: 'vert',
  inscrit: 'vert',
  rejete: 'rouge',
  inactif: 'rouge',
  abandon: 'rouge',
  transfere: 'bleu',
  regulier: 'vert',
  libre: 'bleu',
}

export default {
  name: 'AppBadge',
  props: {
    valeur: { type: [String, Number, Boolean], default: '' },
    /** Famille de libellés (voir LIBELLES dans format.js), ex. 'statut_validation'. */
    famille: { type: String, default: '' },
    /** Force une couleur : 'vert' | 'ambre' | 'rouge' | 'bleu' | 'gris'. */
    couleur: { type: String, default: '' },
  },
  computed: {
    texte() {
      // Booléen (ex. `actif: true`) → Actif / Inactif
      if (typeof this.valeur === 'boolean') return this.valeur ? 'Actif' : 'Inactif'
      return this.famille ? libelle(this.famille, this.valeur) : String(this.valeur ?? '—')
    },
    classes() {
      let couleur = this.couleur
      if (!couleur) {
        if (typeof this.valeur === 'boolean') couleur = this.valeur ? 'vert' : 'rouge'
        else couleur = COULEURS[this.valeur] || 'gris'
      }
      return {
        vert: 'bg-cnece-secondary text-cnece-primary',
        ambre: 'bg-amber-50 text-cnece-gold border border-amber-200',
        rouge: 'bg-red-50 text-cnece-danger border border-red-200',
        bleu: 'bg-blue-50 text-blue-700 border border-blue-200',
        gris: 'bg-slate-100 text-slate-600',
      }[couleur]
    },
  },
}
</script>
