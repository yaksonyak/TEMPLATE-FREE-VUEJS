<!-- src/views/referentiels/FilieresView.vue
     Objectif : consulter les filières de l'enseignement technique et professionnel,
     avec leur diplôme (CAP en 2 ans, BT en 4 ans).
     Endpoint : GET /filieres (diplome, page, par_page, recherche, tri, ordre) — lecture seule.
     Permissions : tous les rôles connectés. -->
<template>
  <AppCard titre="Filières techniques" sous-titre="Référentiel national — lecture seule" sans-marge>
    <template #actions>
      <select
        v-model="params.diplome"
        aria-label="Filtrer par diplôme"
        class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white"
        @change="filtrer"
      >
        <option value="">Tous les diplômes</option>
        <option value="CAP">CAP (2 ans)</option>
        <option value="BT">BT (4 ans)</option>
      </select>
      <input
        v-model="params.recherche"
        type="search"
        placeholder="Rechercher…"
        aria-label="Rechercher une filière"
        class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-cnece-accent"
      />
    </template>

    <AppTable
      :colonnes="colonnes"
      :lignes="elements"
      :chargement="chargement"
      :erreur="erreur"
      :tri="params.tri"
      :ordre="params.ordre"
      message-vide="Aucune filière ne correspond aux critères."
      @trier="trier"
      @reessayer="charger"
    >
      <template #cellule-code="{ valeur }">
        <span class="font-mono font-semibold text-cnece-primary">{{ valeur }}</span>
      </template>
      <template #cellule-diplome="{ valeur }">
        <AppBadge :valeur="valeur" :couleur="valeur === 'BT' ? 'bleu' : 'vert'" />
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
  name: 'FilieresView',
  mixins: [listeApi],

  data() {
    return {
      colonnes: [
        { cle: 'code', libelle: 'Code', triable: true, classe: 'w-32' },
        { cle: 'libelle', libelle: 'Libellé', triable: true },
        { cle: 'diplome', libelle: 'Diplôme', triable: true, classe: 'w-32' },
        {
          cle: 'duree_annees',
          libelle: 'Durée',
          triable: true,
          classe: 'w-28',
          format: (v) => (v ? `${v} an${v > 1 ? 's' : ''}` : '—'),
        },
      ],
    }
  },

  methods: {
    // Filtre propre à cette page, ajouté aux params du mixin
    filtresInitiaux() {
      return { diplome: '' }
    },
    chargerElements(params) {
      return referentielsService.listerFilieres(params)
    },
  },
}
</script>
