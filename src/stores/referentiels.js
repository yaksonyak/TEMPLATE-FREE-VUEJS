// src/stores/referentiels.js
// Store « cache » des petits référentiels utilisés par de nombreux formulaires
// (séries, filières, année active). On les charge une fois et on les réutilise,
// au lieu de rappeler l'API à chaque ouverture de formulaire.
import { defineStore } from 'pinia'
import referentielsService from '@/services/referentiels.service.js'

export const useReferentielsStore = defineStore('referentiels', {
  state: () => ({
    series: [],        // [{ id, code, libelle }]
    filieres: [],      // [{ id, code, libelle, diplome, duree_annees }]
    anneeActive: null, // { id, libelle, active, nb_inscriptions }
    chargement: false,
  }),

  getters: {
    /** Options prêtes pour <AppSelect> : « TSE — Sciences Exactes » */
    optionsSeries: (state) =>
      state.series.map((s) => ({ valeur: s.id, libelle: `${s.code} — ${s.libelle}` })),

    /** Options filières, filtrables par diplôme : optionsFilieres('CAP') */
    optionsFilieres: (state) => (diplome = null) =>
      state.filieres
        .filter((f) => !diplome || f.diplome === diplome)
        .map((f) => ({ valeur: f.id, libelle: `${f.code} — ${f.libelle} (${f.diplome}, ${f.duree_annees} ans)` })),
  },

  actions: {
    /** Charge séries et filières si ce n'est pas déjà fait (par_page 100 = tout, ces listes sont courtes). */
    async chargerTout() {
      if (this.series.length && this.filieres.length && this.anneeActive) return
      this.chargement = true
      try {
        const [series, filieres, annees] = await Promise.all([
          referentielsService.listerSeries({ par_page: 100 }),
          referentielsService.listerFilieres({ par_page: 100 }),
          referentielsService.listerAnneesScolaires({ active: true, par_page: 1 }),
        ])
        this.series = series.elements
        this.filieres = filieres.elements
        this.anneeActive = annees.elements[0] || null
      } finally {
        this.chargement = false
      }
    },

    /** À appeler après une activation d'année pour rafraîchir le cache. */
    async rechargerAnneeActive() {
      const annees = await referentielsService.listerAnneesScolaires({ active: true, par_page: 1 })
      this.anneeActive = annees.elements[0] || null
    },
  },
})
