<template>
  <div class="space-y-4">
    <template v-if="modeDemo">
      <AppCard>
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 class="text-xl font-bold text-slate-800">Bonjour, {{ nomComplet }}</h2>
            <p class="mt-1 text-sm text-slate-500">Aperçu des données renvoyées par votre API.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <router-link v-for="r in ressourcesDemo" :key="r.cle" :to="{ name: 'demo-ressource', params: { ressource: r.cle } }" class="btn-outline text-sm">{{ r.libelle }}</router-link>
          </div>
        </div>
      </AppCard>

      <AppAlert v-if="dashboardErreur" type="erreur" :message="dashboardErreur" />
      <p v-else-if="dashboardChargement" class="text-sm text-slate-500">Chargement des données depuis l’API…</p>
      <template v-else>
        <div class="grid gap-4 sm:grid-cols-3">
          <AppCard v-for="indicateur in indicateursApi" :key="indicateur.libelle">
            <p class="text-sm text-slate-500">{{ indicateur.libelle }}</p>
            <p class="mt-2 text-3xl font-bold text-cnece-primary">{{ indicateur.valeur }}</p>
          </AppCard>
        </div>
        <AppCard titre="Évolution des ventes" sous-titre="Chiffre d’affaires mensuel renvoyé par l’API">
          <BarChart v-if="ventesApi.length" titre="Ventes des six derniers mois" :donnees="ventesApi" couleur="bleu" vertical />
          <p v-else class="text-sm text-slate-500">Aucune commande renvoyée par l’API.</p>
        </AppCard>
        <AppCard titre="Activité récente" sous-titre="Commandes renvoyées par l’API">
          <div class="overflow-x-auto">
            <table class="cnece-table">
              <thead><tr><th>Référence</th><th>Client</th><th>Date</th><th>Total</th><th>Statut</th></tr></thead>
              <tbody>
                <tr v-for="commande in commandesRecentes" :key="commande.id || valeurCommande(commande, ['reference', 'ref'])">
                  <td class="font-medium">{{ valeurCommande(commande, ['reference', 'ref']) }}</td>
                  <td>{{ valeurCommande(commande, ['customer_name', 'client', 'customer']) }}</td>
                  <td>{{ valeurCommande(commande, ['date', 'created_at', 'date_commande']) }}</td>
                  <td>{{ valeurCommande(commande, ['total', 'amount', 'montant']) }}</td>
                  <td>{{ valeurCommande(commande, ['status', 'statut']) }}</td>
                </tr>
                <tr v-if="!commandesRecentes.length"><td colspan="5" class="py-8 text-center text-slate-500">Aucune commande renvoyée par l’API.</td></tr>
              </tbody>
            </table>
          </div>
        </AppCard>
      </template>
    </template>

    <template v-else>
      <AppCard>
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-800">Bonjour, {{ nomComplet }}</h2>
            <p class="text-sm text-slate-500 mt-0.5">
              <span class="font-medium text-cnece-primary">{{ roleLibelle }}</span> · {{ perimetreLibelle }}
              <span v-if="stats?.annee_scolaire"> · Année scolaire {{ stats.annee_scolaire.libelle }}</span>
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <router-link v-for="r in raccourcis" :key="r.route" :to="{ name: r.route }" class="btn-outline text-sm">{{ r.libelle }}</router-link>
          </div>
        </div>
      </AppCard>
      <p v-if="chargement" class="text-sm text-slate-500">Chargement des indicateurs…</p>
      <AppAlert v-else-if="erreur" type="erreur" :message="erreur" />
      <template v-else-if="stats">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard libelle="Élèves inscrits" :valeur="stats.effectifs?.eleves ?? stats.effectifs?.total ?? 0" />
          <StatCard v-if="stats.effectifs?.etablissements !== undefined" libelle="Établissements" :valeur="stats.effectifs.etablissements" couleur="bleu" />
          <StatCard libelle="Candidatures en attente" :valeur="candidatsEnAttente" couleur="ambre" :sous-texte="`${stats.candidats?.total ?? 0} au total`" />
          <StatCard libelle="Transferts en attente" :valeur="stats.transferts?.par_statut?.en_attente ?? 0" couleur="ambre" :sous-texte="`${stats.transferts?.total ?? 0} au total`" />
        </div>
        <AppCard titre="Vue d'ensemble" :sous-titre="libellePerimetreStats">
          <template #actions><router-link :to="{ name: 'statistiques' }" class="btn-outline text-sm">Statistiques détaillées et exports</router-link></template>
          <StatistiquesPanel :stats="stats" />
        </AppCard>
      </template>
    </template>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import statistiquesService from '@/services/statistiques.service.js'
import demoResourcesService from '@/services/demoResources.service.js'
import { useAuthStore } from '@/stores/auth.js'
import { canSee } from '@/utils/permissions.js'

const MODE_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'
const RESSOURCES_DEMO = [
  { cle: 'produits', libelle: 'Produits' },
  { cle: 'commandes', libelle: 'Commandes' },
  { cle: 'clients', libelle: 'Clients' },
]
const RACCOURCIS = [
  { route: 'eleve-nouveau', libelle: '+ Inscrire un élève' },
  { route: 'recherche-nationale', libelle: 'Rechercher un matricule' },
  { route: 'transferts', libelle: 'Transferts' },
  { route: 'candidats', libelle: 'Candidats' },
  { route: 'utilisateurs', libelle: 'Utilisateurs' },
]

function dateCommande(commande) {
  return commande.date || commande.created_at || commande.order_date || commande.date_commande || null
}

function montantCommande(commande) {
  const montant = commande.total ?? commande.amount ?? commande.montant
  return Number(String(montant ?? '').replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
}

function construireVentes(commandes) {
  const mois = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - (5 - index))
    return {
      date,
      cle: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      libelle: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date),
    }
  })
  return mois.map((moisCourant) => ({
    libelle: moisCourant.libelle,
    valeur: commandes.reduce((total, commande) => {
      const date = dateCommande(commande)
      if (!date || Number.isNaN(new Date(date).getTime())) return total
      const dateObjet = new Date(date)
      const cle = `${dateObjet.getFullYear()}-${String(dateObjet.getMonth() + 1).padStart(2, '0')}`
      return total + (cle === moisCourant.cle ? montantCommande(commande) : 0)
    }, 0),
  }))
}

export default {
  name: 'DashboardView',
  data() {
    return {
      stats: null, chargement: true, erreur: '', modeDemo: MODE_DEMO,
      ressourcesDemo: RESSOURCES_DEMO,
      dashboardChargement: true, dashboardErreur: '', indicateursApi: [], ventesApi: [], commandesRecentes: [],
    }
  },
  computed: {
    ...mapState(useAuthStore, ['nomComplet', 'roleLibelle', 'perimetreLibelle', 'perimetre', 'role']),
    raccourcis() {
      return RACCOURCIS.filter((r) => canSee(this.$router.resolve({ name: r.route }), this.role))
    },
    candidatsEnAttente() {
      return Object.values(this.stats?.candidats?.par_examen || {}).reduce((s, d) => s + (d.par_statut?.en_attente ?? 0), 0)
    },
    libellePerimetreStats() {
      const s = this.stats
      return s?.etablissement?.nom || s?.cap?.nom || s?.academie?.nom || 'Tout le territoire'
    },
  },
  async created() {
    if (this.modeDemo) {
      this.chargement = false
      this.chargerDashboardApi()
      return
    }
    try {
      this.stats = await statistiquesService.pourPerimetre(this.perimetre)
    } catch (erreur) {
      this.erreur = erreur.message
    } finally {
      this.chargement = false
    }
  },
  methods: {
    valeurCommande(commande, cles) {
      const cle = cles.find((candidate) => commande[candidate] !== undefined && commande[candidate] !== null)
      return cle ? commande[cle] : '—'
    },
    async chargerDashboardApi() {
      this.dashboardChargement = true
      try {
        const [produits, commandes, clients] = await Promise.all([
          demoResourcesService.lister('produits', { page: 1, par_page: 100 }),
          demoResourcesService.lister('commandes', { page: 1, par_page: 100 }),
          demoResourcesService.lister('clients', { page: 1, par_page: 100 }),
        ])
        this.indicateursApi = [
          { libelle: 'Produits', valeur: produits.pagination.total },
          { libelle: 'Commandes', valeur: commandes.pagination.total },
          { libelle: 'Clients', valeur: clients.pagination.total },
        ]
        this.commandesRecentes = commandes.elements.slice(0, 5)
        this.ventesApi = construireVentes(commandes.elements)
        this.dashboardErreur = ''
      } catch (erreur) {
        this.dashboardErreur = erreur.message || 'Impossible de charger le tableau de bord depuis l’API.'
      } finally {
        this.dashboardChargement = false
      }
    },
  },
}
</script>
