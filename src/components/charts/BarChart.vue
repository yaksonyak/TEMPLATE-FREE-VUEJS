<!-- src/components/charts/BarChart.vue
  Graphique à barres en pur HTML/CSS (aucune bibliothèque).
     Reçoit [{ libelle, valeur }] et dessine une barre proportionnelle au maximum.
     Supporte une couleur unique (prop couleur) ou des couleurs par barre (prop couleurs).
     Suffisant pour les répartitions de l'API (par ordre, par niveau, par genre…). -->
<template>
  <div>
    <p v-if="titre" class="text-sm font-semibold text-slate-700 mb-3">{{ titre }}</p>
    <p v-if="donnees.length === 0" class="text-sm text-slate-500">Aucune donnée.</p>
    <div v-else-if="vertical" class="w-full pb-1">
      <ul class="flex w-full items-end gap-2 sm:gap-3 h-48 pt-6 border-b border-slate-200">
        <li v-for="(item, index) in donnees" :key="item.libelle" class="group min-w-0 flex-1 h-full flex flex-col items-center justify-end gap-1.5 text-xs">
          <span class="font-semibold text-slate-800 tabular-nums">{{ formaterNombre(item.valeur) }}</span>
          <div class="w-full h-36 flex items-end justify-center">
            <div
              class="w-full max-w-[24px] rounded-t transition-all duration-300 group-hover:brightness-110"
              :class="classeBarre(index)"
              :style="styleBarre(index, item.valeur)"
              role="img"
              :aria-label="`${item.libelle} : ${formaterNombre(item.valeur)}`"
              :title="`${item.libelle} : ${formaterNombre(item.valeur)}`"
            />
          </div>
        </li>
      </ul>
      <ul class="flex w-full gap-2 sm:gap-3 pt-1.5">
        <li v-for="item in donnees" :key="item.libelle" class="min-w-0 flex-1 text-center text-[11px] leading-tight text-slate-500 px-0.5" :title="item.libelle">
          {{ item.libelle }}
        </li>
      </ul>
    </div>
    <ul v-else class="space-y-2">
      <li v-for="(item, index) in donnees" :key="item.libelle" class="grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-3 text-sm">
        <span class="truncate text-slate-600" :title="item.libelle">{{ item.libelle }}</span>
        <div class="h-3 rounded-full bg-slate-100 overflow-hidden" role="img" :aria-label="`${item.libelle} : ${item.valeur}`">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="classeBarre(index)"
            :style="styleBarre(index, item.valeur)"
          />
        </div>
        <span class="font-medium text-slate-800 tabular-nums">{{ formaterNombre(item.valeur) }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
import { formaterNombre } from '@/utils/format.js'

/** Palette de couleurs nommées → classes Tailwind (quand pas de couleur hex). */
const CLASSES_COULEUR = {
  vert: 'bg-cnece-primary',
  accent: 'bg-cnece-accent',
  ambre: 'bg-cnece-gold',
  rouge: 'bg-cnece-danger',
  bleu: 'bg-blue-600',
}

export default {
  name: 'BarChart',
  props: {
    titre: { type: String, default: '' },
    donnees: { type: Array, default: () => [] }, // [{ libelle, valeur }]
    couleur: { type: String, default: 'vert' },
    couleurs: { type: Array, default: null }, // couleur nommée ou hex par barre, ex: ['#3B82F6','#F59E0B',...]
    vertical: { type: Boolean, default: false },
  },
  computed: {
    maximum() {
      return Math.max(0, ...this.donnees.map((d) => Number(d.valeur) || 0))
    },
  },
  methods: {
    formaterNombre,
    largeur(valeur) {
      if (!this.maximum) return '0%'
      return `${Math.round((Number(valeur) / this.maximum) * 100)}%`
    },
    /** Retourne la classe Tailwind (si couleur nommée) ou '' (si hex). */
    classeBarre(index) {
      const c = this.couleurs?.[index] ?? this.couleur
      return CLASSES_COULEUR[c] || ''
    },
    /** Retourne le style inline (width + background-color si hex). */
    styleBarre(index, valeur) {
      const c = this.couleurs?.[index] ?? this.couleur
      const style = this.vertical ? { height: this.largeur(valeur) } : { width: this.largeur(valeur) }
      // Si c'est un hex/rgb, on l'applique en inline ; sinon la classe Tailwind s'en charge.
      if (c && !CLASSES_COULEUR[c]) {
        style.backgroundColor = c
      }
      return style
    },
  },
}
</script>
