<!-- src/views/referentiels/SeriesView.vue
     Objectif : consulter les séries du lycée (TSE, TSExp, TSS, TLL, TSEco…).
     Endpoint : GET /series (page, par_page, recherche, tri, ordre) — lecture seule dans l'API.
     Permissions : tous les rôles connectés (aucune restriction dans la route). -->
<template>
  <AppCard titre="Séries du lycée" sous-titre="Référentiel national — lecture seule" sans-marge>
    <template #actions>
      <input
        v-model="params.recherche"
        type="search"
        placeholder="Rechercher un code ou un libellé…"
        aria-label="Rechercher une série"
        class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-cnece-accent"
      />
    </template>

    <AppTable
      :colonnes="colonnes"
      :lignes="elements"
      :chargement="chargement"
      :erreur="erreur"
      :tri="params.tri"
      :ordre="params.ordre"
      message-vide="Aucune série ne correspond à la recherche."
      @trier="trier"
      @reessayer="charger"
    >
      <template #cellule-code="{ valeur }">
        <span class="font-mono font-semibold text-cnece-primary">{{ valeur }}</span>
      </template>
    </AppTable>

    <template #pied>
      <AppPagination :pagination="pagination" @changer-page="changerPage" @changer-taille="changerTaille" />
    </template>
  </AppCard>
</template>

<script>
import listeApi from '@/mixins/listeApi.js'
import referentielsService from '@/services/referentiels.service.js'

export default {
  name: 'SeriesView',
  mixins: [listeApi], // apporte elements, pagination, params, charger(), trier()…

  data() {
    return {
      colonnes: [
        { cle: 'code', libelle: 'Code', triable: true, classe: 'w-32' },
        { cle: 'libelle', libelle: 'Libellé', triable: true },
      ],
    }
  },

  methods: {
    // Méthode attendue par le mixin : l'appel API de CETTE page.
    chargerElements(params) {
      return referentielsService.listerSeries(params)
    },
  },
}
</script>
