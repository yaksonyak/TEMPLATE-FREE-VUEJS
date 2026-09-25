<!-- src/components/common/AppPagination.vue
     Pagination SERVEUR : affiche l'objet `pagination` renvoyé par l'API
     ({ page, par_page, total, total_pages }) et émet la page ou la taille voulue.
     C'est la page parente qui relance l'appel API. -->
<template>
  <div v-if="pagination.total > 0" class="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
    <p>
      <span class="font-medium">{{ debut }}</span>–<span class="font-medium">{{ fin }}</span>
      sur <span class="font-medium">{{ formaterNombre(pagination.total) }}</span>
    </p>

    <div class="flex items-center gap-3">
      <label class="inline-flex items-center gap-2">
        <span class="sr-only sm:not-sr-only">Par page</span>
        <select
          :value="pagination.par_page"
          class="rounded-lg border border-slate-300 px-2 py-1 text-sm"
          @change="$emit('changer-taille', Number($event.target.value))"
        >
          <option v-for="taille in tailles" :key="taille" :value="taille">{{ taille }}</option>
        </select>
      </label>

      <nav class="inline-flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          class="btn-outline text-sm px-3 py-1.5"
          :disabled="pagination.page <= 1"
          @click="$emit('changer-page', pagination.page - 1)"
        >
          Précédent
        </button>
        <span class="px-2">
          Page <span class="font-medium">{{ pagination.page }}</span> / {{ pagination.total_pages }}
        </span>
        <button
          type="button"
          class="btn-outline text-sm px-3 py-1.5"
          :disabled="pagination.page >= pagination.total_pages"
          @click="$emit('changer-page', pagination.page + 1)"
        >
          Suivant
        </button>
      </nav>
    </div>
  </div>
</template>

<script>
import { formaterNombre } from '@/utils/format.js'

export default {
  name: 'AppPagination',
  props: {
    pagination: {
      type: Object,
      default: () => ({ page: 1, par_page: 15, total: 0, total_pages: 1 }),
    },
    tailles: { type: Array, default: () => [15, 30, 50, 100] }, // max API = 100
  },
  emits: ['changer-page', 'changer-taille'],
  computed: {
    debut() {
      return (this.pagination.page - 1) * this.pagination.par_page + 1
    },
    fin() {
      return Math.min(this.pagination.page * this.pagination.par_page, this.pagination.total)
    },
  },
  methods: { formaterNombre },
}
</script>
