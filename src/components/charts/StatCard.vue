<!-- src/components/charts/StatCard.vue
     Tuile de statistique : libellé, grande valeur formatée, sous-texte optionnel.
     Utilisée sur le tableau de bord et la page Statistiques. -->
<template>
  <div
    class="bg-white rounded-xl shadow-md border border-slate-200 border-l-4 p-5 flex items-start gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default"
    :style="{ borderLeftColor: styleBordure }"
  >
    <div
      class="h-11 w-11 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
      :style="styleIcone"
      aria-hidden="true"
    >
      <slot name="icone">
        <span class="text-lg font-bold">{{ initiale }}</span>
      </slot>
    </div>
    <div class="min-w-0">
      <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">{{ libelle }}</p>
      <p v-if="chargement" class="mt-1 h-8 w-24 rounded bg-slate-100 animate-pulse" />
      <p v-else class="mt-1 text-2xl font-bold" :class="classesValeur">{{ valeurFormatee }}</p>
      <p v-if="sousTexte" class="text-xs text-slate-500 mt-0.5 truncate">{{ sousTexte }}</p>
    </div>
  </div>
</template>

<script>
import { formaterNombre } from '@/utils/format.js'

export default {
  name: 'StatCard',
  props: {
    libelle: { type: String, required: true },
    valeur: { type: [Number, String], default: null },
    sousTexte: { type: String, default: '' },
    couleur: { type: String, default: 'vert' }, // 'vert' | 'ambre' | 'rouge' | 'bleu' | 'gris'
    chargement: { type: Boolean, default: false },
  },
  computed: {
    valeurFormatee() {
      return typeof this.valeur === 'number' ? formaterNombre(this.valeur) : (this.valeur ?? '—')
    },
    initiale() {
      return this.libelle.charAt(0).toUpperCase()
    },
    classesIcone() {
      return {
        vert: 'bg-cnece-secondary text-cnece-primary',
        ambre: 'bg-amber-50 text-cnece-gold',
        rouge: 'bg-red-50 text-cnece-danger',
        bleu: 'bg-blue-50 text-blue-700',
        gris: 'bg-slate-100 text-slate-600',
      }[this.couleur]
    },
    styleIcone() {
      const gradients = {
        vert: { background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#047857' },
        ambre: { background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#b45309' },
        rouge: { background: 'linear-gradient(135deg, #fee2e2, #fecaca)', color: '#dc2626' },
        bleu: { background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#1d4ed8' },
        gris: { background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', color: '#475569' },
      }
      return gradients[this.couleur] || gradients.vert
    },
    styleBordure() {
      const couleurs = {
        vert: '#047857',
        ambre: '#d97706',
        rouge: '#dc2626',
        bleu: '#2563eb',
        gris: '#64748b',
      }
      return couleurs[this.couleur] || couleurs.vert
    },
    classesValeur() {
      return {
        vert: 'text-emerald-700',
        ambre: 'text-amber-700',
        rouge: 'text-red-600',
        bleu: 'text-blue-700',
        gris: 'text-slate-700',
      }[this.couleur] || 'text-slate-800'
    },
  },
}
</script>
