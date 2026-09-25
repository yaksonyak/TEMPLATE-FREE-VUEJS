<!-- src/components/common/AppTable.vue
     Tableau générique branché sur les listes de l'API.
     - `colonnes` décrit les en-têtes ; `lignes` sont les `elements` renvoyés par l'API.
     - Gère lui-même les 4 états : chargement / erreur / vide / succès.
     - Tri SERVEUR : cliquer un en-tête triable émet `trier` ({ tri, ordre }) ;
       la page relance l'appel API avec ces paramètres.
     - Personnalisation d'une cellule via un slot nommé `cellule-<cle>`,
       et colonne d'actions via le slot `actions`. -->
<template>
  <div class="overflow-x-auto">
    <table class="cnece-table">
      <thead>
        <tr>
          <th
            v-for="colonne in colonnes"
            :key="colonne.cle"
            :class="[colonne.classe, colonne.triable ? 'cursor-pointer select-none hover:bg-white/20 transition-colors duration-150' : '']"
            :aria-sort="ariaSort(colonne)"
            @click="colonne.triable && trierPar(colonne.cle)"
          >
            <span class="inline-flex items-center gap-1">
              {{ colonne.libelle }}
              <span v-if="colonne.triable" class="text-white/60" aria-hidden="true">
                <template v-if="tri === colonne.cle">{{ ordre === 'asc' ? '▲' : '▼' }}</template>
                <template v-else>⇅</template>
              </span>
            </span>
          </th>
          <th v-if="$slots.actions" class="text-right">Actions</th>
        </tr>
      </thead>

      <tbody>
        <!-- État : chargement -->
        <tr v-if="chargement">
          <td :colspan="nbColonnes" class="text-center py-10 text-slate-500">
            <span class="inline-flex items-center gap-2">
              <AppLoader />
              Chargement…
            </span>
          </td>
        </tr>

        <!-- État : erreur -->
        <tr v-else-if="erreur">
          <td :colspan="nbColonnes" class="text-center py-10 text-cnece-danger">
            {{ erreur }}
            <button type="button" class="ml-2 underline" @click="$emit('reessayer')">Réessayer</button>
          </td>
        </tr>

        <!-- État : vide -->
        <tr v-else-if="lignes.length === 0">
          <td :colspan="nbColonnes" class="text-center py-10 text-slate-500">
            {{ messageVide }}
          </td>
        </tr>

        <!-- État : succès -->
        <template v-else>
          <tr
            v-for="(ligne, index) in lignes"
            :key="ligne.id ?? index"
            class="group hover:bg-cnece-secondary/50 even:bg-slate-50/60 transition-colors duration-200"
            :class="{ 'cursor-pointer': cliquable }"
            @click="cliquable && $emit('ligne-cliquee', ligne)"
          >
            <td v-for="colonne in colonnes" :key="colonne.cle" :class="colonne.classe">
              <slot :name="`cellule-${colonne.cle}`" :ligne="ligne" :valeur="valeur(ligne, colonne)">
                {{ colonne.format ? colonne.format(valeur(ligne, colonne), ligne) : (valeur(ligne, colonne) ?? '—') }}
              </slot>
            </td>
            <td v-if="$slots.actions" class="text-right whitespace-nowrap" @click.stop>
              <slot name="actions" :ligne="ligne" />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'AppTable',
  props: {
    colonnes: { type: Array, required: true },
    lignes: { type: Array, default: () => [] },
    chargement: { type: Boolean, default: false },
    erreur: { type: String, default: '' },
    messageVide: { type: String, default: 'Aucun élément à afficher.' },
    tri: { type: String, default: '' },
    ordre: { type: String, default: 'asc' },
    cliquable: { type: Boolean, default: false },
  },
  emits: ['trier', 'ligne-cliquee', 'reessayer'],
  computed: {
    nbColonnes() {
      return this.colonnes.length + (this.$slots.actions ? 1 : 0)
    },
  },
  methods: {
    valeur(ligne, colonne) {
      return colonne.cle.split('.').reduce((obj, partie) => obj?.[partie], ligne)
    },
    trierPar(cle) {
      const ordre = this.tri === cle && this.ordre === 'asc' ? 'desc' : 'asc'
      this.$emit('trier', { tri: cle, ordre })
    },
    ariaSort(colonne) {
      if (!colonne.triable) return null
      if (this.tri !== colonne.cle) return 'none'
      return this.ordre === 'asc' ? 'ascending' : 'descending'
    },
  },
}
</script>
