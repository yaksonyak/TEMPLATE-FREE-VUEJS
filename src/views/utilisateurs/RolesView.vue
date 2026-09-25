<!-- src/views/utilisateurs/RolesView.vue
     Objectif : documenter la matrice des rôles telle qu'elle est APPLIQUÉE dans le front.
     Aucun endpoint : les rôles sont une énumération fixe de l'API. La page lit directement
     utils/permissions.js (droits d'écriture, de validation) et router/index.js (pages visibles),
     donc elle reste toujours synchronisée avec le code.
     Permissions : admin_national. -->
<template>
  <div class="space-y-4">
    <AppCard titre="Rôles et permissions" sous-titre="Règle fondamentale : chaque acteur ne voit et ne modifie que les données de son périmètre (RG-8)">
      <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
        <div v-for="r in roles" :key="r.valeur" class="rounded-lg border border-slate-200 p-3">
          <p class="font-semibold text-cnece-primary">{{ r.libelle }}</p>
          <p class="text-xs font-mono text-slate-500 mt-0.5">{{ r.valeur }}</p>
          <p class="text-xs text-slate-600 mt-2">{{ r.perimetre }}</p>
        </div>
      </div>
    </AppCard>

    <AppCard titre="Pages accessibles" sous-titre="Déduit des meta.roles du router" sans-marge>
      <div class="overflow-x-auto">
        <table class="cnece-table">
          <thead>
            <tr><th>Page</th><th v-for="r in roles" :key="r.valeur" class="text-center">{{ r.court }}</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in pages" :key="p.name">
              <td class="font-medium">{{ p.titre }}</td>
              <td v-for="r in roles" :key="r.valeur" class="text-center">
                <span v-if="canSee(p, r.valeur)" class="text-cnece-accent font-bold" aria-label="oui">✓</span>
                <span v-else class="text-slate-300" aria-label="non">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <div class="grid lg:grid-cols-2 gap-4">
      <AppCard titre="Droits de création / modification" sous-titre="canEdit(ressource, rôle)" sans-marge>
        <table class="cnece-table">
          <thead><tr><th>Ressource</th><th v-for="r in roles" :key="r.valeur" class="text-center">{{ r.court }}</th></tr></thead>
          <tbody>
            <tr v-for="(rolesOk, ressource) in DROITS_ECRITURE" :key="ressource">
              <td class="font-medium">{{ libelleRessource(ressource) }}</td>
              <td v-for="r in roles" :key="r.valeur" class="text-center">
                <span v-if="rolesOk.includes(r.valeur)" class="text-cnece-accent font-bold">✓</span><span v-else class="text-slate-300">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </AppCard>

      <AppCard titre="Droits de validation / rejet" sous-titre="canValidate(ressource, rôle)" sans-marge>
        <table class="cnece-table">
          <thead><tr><th>Ressource</th><th v-for="r in roles" :key="r.valeur" class="text-center">{{ r.court }}</th></tr></thead>
          <tbody>
            <tr v-for="(rolesOk, ressource) in DROITS_VALIDATION" :key="ressource">
              <td class="font-medium">{{ libelleRessource(ressource) }}</td>
              <td v-for="r in roles" :key="r.valeur" class="text-center">
                <span v-if="rolesOk.includes(r.valeur)" class="text-cnece-accent font-bold">✓</span><span v-else class="text-slate-300">—</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="p-4 text-xs text-slate-500">
          Les validations restent limitées au périmètre : un agent CAP valide les transferts entre deux écoles de son CAP et les
          candidats DEF de son CAP ; un administrateur d'académie, les établissements de son académie et les candidats BAC/CAP/BT.
        </p>
      </AppCard>
    </div>
  </div>
</template>

<script>
import { TOUS_LES_ROLES, LIBELLES_ROLES, DROITS_ECRITURE, DROITS_VALIDATION, canSee } from '@/utils/permissions.js'

const PERIMETRES = {
  admin_national: 'Tout le territoire : référentiels, utilisateurs, statistiques nationales, paramétrage.',
  admin_academie: 'Son académie : CAP, lycées et techniques, candidats BAC/CAP/BT, validation des transferts, stats.',
  agent_cap: 'Son CAP : écoles fondamentales, élèves, candidats DEF, validation des transferts, stats CAP.',
  directeur_etablissement: 'Son établissement : inscriptions, réinscriptions, candidats réguliers, demandes de transfert.',
  consultation: 'Lecture seule : tableaux de bord et statistiques (403 sur toute donnée nominative).',
}
const COURTS = { admin_national: 'National', admin_academie: 'Académie', agent_cap: 'CAP', directeur_etablissement: 'Directeur', consultation: 'Consult.' }
const RESSOURCES = {
  academies: 'Académies', caps: 'CAP', etablissements: 'Établissements', annees_scolaires: 'Années scolaires',
  eleves: 'Élèves (inscription, réinscription, état civil)', transferts: 'Transferts (demande)', candidats: 'Candidatures (dépôt)',
  utilisateurs: 'Utilisateurs',
}

export default {
  name: 'RolesView',
  data() {
    return {
      DROITS_ECRITURE,
      DROITS_VALIDATION,
      roles: TOUS_LES_ROLES.map((r) => ({ valeur: r, libelle: LIBELLES_ROLES[r], court: COURTS[r], perimetre: PERIMETRES[r] })),
    }
  },
  computed: {
    /** Toutes les routes « métier » du layout par défaut (avec un titre, hors erreurs). */
    pages() {
      return this.$router
        .getRoutes()
        .filter((r) => r.name && r.meta?.titre && !r.meta.public && !['acces-refuse', 'introuvable'].includes(r.name))
        .map((r) => ({ name: r.name, titre: r.meta.titre, meta: r.meta }))
        .sort((a, b) => a.titre.localeCompare(b.titre, 'fr'))
    },
  },
  methods: {
    canSee,
    libelleRessource(cle) {
      return RESSOURCES[cle] || cle
    },
  },
}
</script>
