<template>
  <div class="space-y-4">
    <AppAlert v-if="succes" type="succes" :message="succes" fermable @fermer="succes = ''" />
    <AppAlert v-if="erreur" type="erreur" :message="erreur" :erreurs="erreursApi" />
    <AppCard :titre="configuration.titre" :sous-titre="configuration.description">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-slate-500">{{ pagination.total }} résultat(s)</p>
        <div class="flex flex-wrap gap-2">
          <input
            v-model="recherche"
            type="search"
            :placeholder="`Rechercher ${configuration.nom.toLowerCase()}…`"
            class="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cnece-accent"
          />
          <AppButton @click="ouvrirFormulaire">+ Ajouter</AppButton>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="cnece-table">
          <thead><tr><th v-for="colonne in configuration.colonnes" :key="colonne">{{ colonne }}</th><th class="text-right">Actions</th></tr></thead>
          <tbody>
            <tr v-if="chargement"><td :colspan="configuration.colonnes.length + 1" class="py-8 text-center text-slate-500">Chargement…</td></tr>
            <tr v-else-if="!erreur && !lignes.length"><td :colspan="configuration.colonnes.length + 1" class="py-8 text-center text-slate-500">Aucune donnée renvoyée par l’API.</td></tr>
            <template v-else>
              <tr v-for="(ligne, index) in lignes" :key="ligne.id ?? index">
                <td v-for="colonne in configuration.colonnes" :key="colonne">{{ valeurColonne(ligne, colonne) }}</td>
                <td class="text-right">
                  <div class="inline-flex items-center gap-1">
                    <AppIconButton action="voir" titre="Voir le détail" @click.stop="voirDetail(ligne)" />
                    <AppIconButton action="modifier" titre="Modifier" @click.stop="modifier(ligne)" />
                    <AppIconButton action="supprimer" titre="Supprimer" @click.stop="confirmerSuppression(ligne)" />
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <AppPagination
        class="mt-4"
        :pagination="pagination"
        :tailles="[5, 10, 15, 30]"
        @changer-page="page = $event"
        @changer-taille="taillePage = $event"
      />
    </AppCard>

    <AppModal :ouvert="modalOuverte" :titre="titreFormulaire" @fermer="modalOuverte = false">
      <form id="formulaire-api" class="space-y-4" @submit.prevent="enregistrer">
        <AppInput
          v-for="champ in configuration.champs"
          :key="champ.cle"
          v-model="formulaire[champ.cle]"
          :label="champ.label"
          :type="champ.type || 'text'"
          :placeholder="champ.placeholder"
          :min="champ.type === 'number' ? '0' : undefined"
          :step="champ.type === 'number' ? '0.01' : undefined"
          obligatoire
        />
      </form>
      <template #pied>
        <AppButton variante="outline" @click="modalOuverte = false">Annuler</AppButton>
        <AppButton type="submit" form="formulaire-api" :chargement="chargement">{{ indexModification === null ? 'Créer' : 'Enregistrer' }}</AppButton>
      </template>
    </AppModal>

    <AppModal :ouvert="detailOuvert" :titre="`Détail : ${configuration.singulier}`" taille="sm" @fermer="detailOuvert = false">
      <dl v-if="detailLigne" class="space-y-3">
        <div v-for="(valeur, cle) in detailLigne" :key="cle" class="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 last:border-0">
          <dt class="text-sm text-slate-500">{{ cle }}</dt><dd class="text-right text-sm font-medium text-slate-800">{{ valeur }}</dd>
        </div>
      </dl>
    </AppModal>
    <AppConfirmModal
      :ouvert="Boolean(ligneASupprimer)"
      titre="Supprimer cet élément ?"
      message="Cette action sera transmise à l’API."
      libelle-confirmer="Supprimer"
      variante="danger"
      :chargement="chargement"
      @fermer="ligneASupprimer = null"
      @confirmer="supprimer"
    />
  </div>
</template>

<script>
import demoResourcesService from '@/services/demoResources.service.js'

const CONFIGURATIONS = {
  produits: {
    titre: 'Catalogue des produits', nom: 'produits', singulier: 'un produit', description: 'Liste chargée depuis l’API configurée.',
    colonnes: ['Nom', 'Catégorie', 'Prix', 'Stock'],
    champs: [
      { cle: 'name', label: 'Nom', placeholder: 'Nom du produit' },
      { cle: 'category', label: 'Catégorie', placeholder: 'Catégorie' },
      { cle: 'price', label: 'Prix', type: 'number', placeholder: '0.00' },
      { cle: 'stock', label: 'Stock', type: 'number', placeholder: '0' },
    ],
  },
  commandes: {
    titre: 'Commandes', nom: 'commandes', singulier: 'une commande', description: 'Liste chargée depuis l’API configurée.',
    colonnes: ['Référence', 'Client', 'Date', 'Total', 'Statut'],
    champs: [
      { cle: 'reference', label: 'Référence', placeholder: 'Référence' },
      { cle: 'customer_name', label: 'Client', placeholder: 'Nom du client' },
      { cle: 'date', label: 'Date', type: 'date' },
      { cle: 'total', label: 'Total', type: 'number', placeholder: '0.00' },
      { cle: 'status', label: 'Statut', placeholder: 'Statut' },
    ],
  },
  clients: {
    titre: 'Clients', nom: 'clients', singulier: 'un client', description: 'Liste chargée depuis l’API configurée.',
    colonnes: ['Nom', 'E-mail', 'Ville', 'Statut'],
    champs: [
      { cle: 'name', label: 'Nom', placeholder: 'Nom complet' },
      { cle: 'email', label: 'E-mail', type: 'email', placeholder: 'nom@domaine.com' },
      { cle: 'city', label: 'Ville', placeholder: 'Ville' },
      { cle: 'status', label: 'Statut', placeholder: 'Statut' },
    ],
  },
}

const CLES_COLONNES = {
  Nom: ['name', 'nom'],
  Catégorie: ['category', 'categorie'],
  Prix: ['price', 'prix'],
  Stock: ['stock', 'quantity', 'quantite'],
  Référence: ['reference', 'ref'],
  Client: ['customer_name', 'client', 'customer'],
  Date: ['date', 'created_at', 'date_commande'],
  Total: ['total', 'amount', 'montant'],
  Statut: ['status', 'statut'],
  'E-mail': ['email', 'e-mail'],
  Ville: ['city', 'ville'],
}

export default {
  name: 'DemoResourceView',
  props: { ressource: { type: String, required: true } },
  data() {
    return {
      recherche: '', page: 1, taillePage: 5, lignes: [],
      pagination: { page: 1, par_page: 5, total: 0, total_pages: 1 },
      chargement: false, erreur: '', erreursApi: null, succes: '', modalOuverte: false,
      detailOuvert: false, detailLigne: null, formulaire: {},
      indexModification: null, ligneASupprimer: null, numeroRequete: 0,
    }
  },
  computed: {
    configuration() { return CONFIGURATIONS[this.ressource] || CONFIGURATIONS.produits },
    titreFormulaire() { return `${this.indexModification === null ? 'Créer' : 'Modifier'} ${this.configuration.singulier}` },
  },
  watch: {
    ressource() { this.page = 1; this.recherche = ''; this.charger() },
    recherche() {
      if (this.page !== 1) { this.page = 1; return }
      this.charger()
    },
    page() { this.charger() },
    taillePage() { this.page = 1; this.charger() },
  },
  created() { this.charger() },
  methods: {
    async charger() {
      const numeroRequete = ++this.numeroRequete
      this.chargement = true
      this.erreur = ''
      this.erreursApi = null
      try {
        const resultat = await demoResourcesService.lister(this.ressource, {
          page: this.page,
          par_page: this.taillePage,
          recherche: this.recherche || undefined,
        })
        if (numeroRequete !== this.numeroRequete) return
        this.lignes = resultat.elements
        this.pagination = resultat.pagination
        if (resultat.pagination.page && resultat.pagination.page !== this.page) this.page = resultat.pagination.page
      } catch (erreur) {
        if (numeroRequete !== this.numeroRequete) return
        this.lignes = []
        this.pagination = { page: 1, par_page: this.taillePage, total: 0, total_pages: 1 }
        this.erreur = erreur.message || 'Impossible de charger les données depuis l’API.'
        this.erreursApi = erreur.erreurs || null
      } finally {
        if (numeroRequete === this.numeroRequete) this.chargement = false
      }
    },
    valeurColonne(ligne, colonne) {
      const cles = CLES_COLONNES[colonne] || [colonne]
      const cle = cles.find((candidate) => ligne[candidate] !== undefined && ligne[candidate] !== null)
      const valeur = cle ? ligne[cle] : ''
      return typeof valeur === 'object' ? (valeur.name || valeur.nom || valeur.email || '') : valeur
    },
    ouvrirFormulaire() {
      this.erreur = ''
      this.succes = ''
      this.indexModification = null
      this.formulaire = Object.fromEntries(this.configuration.champs.map((champ) => [champ.cle, '']))
      this.modalOuverte = true
    },
    modifier(ligne) {
      if (ligne.id === undefined || ligne.id === null) {
        this.erreur = 'L’API doit renvoyer un identifiant id pour permettre la modification.'
        return
      }
      this.erreur = ''
      this.indexModification = ligne.id
      this.formulaire = Object.fromEntries(this.configuration.champs.map((champ) => [champ.cle, ligne[champ.cle] ?? '']))
      this.modalOuverte = true
    },
    async enregistrer() {
      this.chargement = true
      this.erreur = ''
      this.erreursApi = null
      try {
        if (this.indexModification === null) {
          await demoResourcesService.creer(this.ressource, this.formulaire)
          this.succes = `${this.configuration.singulier} créé via l’API.`
        } else {
          await demoResourcesService.modifier(this.ressource, this.indexModification, this.formulaire)
          this.succes = `${this.configuration.singulier} modifié via l’API.`
        }
        this.modalOuverte = false
        await this.charger()
      } catch (erreur) {
        this.erreur = erreur.message || 'Échec de l’enregistrement via l’API.'
        this.erreursApi = erreur.erreurs || null
      } finally {
        this.chargement = false
      }
    },
    voirDetail(ligne) {
      this.detailLigne = ligne
      this.detailOuvert = true
    },
    async supprimer() {
      if (this.ligneASupprimer?.id === undefined || this.ligneASupprimer?.id === null) {
        this.erreur = 'L’API doit renvoyer un identifiant id pour permettre la suppression.'
        this.ligneASupprimer = null
        return
      }
      this.chargement = true
      this.erreur = ''
      this.erreursApi = null
      try {
        await demoResourcesService.supprimer(this.ressource, this.ligneASupprimer.id)
        this.ligneASupprimer = null
        this.succes = 'Élément supprimé via l’API.'
        await this.charger()
      } catch (erreur) {
        this.erreur = erreur.message || 'Échec de la suppression via l’API.'
        this.erreursApi = erreur.erreurs || null
      } finally {
        this.chargement = false
      }
    },
  },
}
</script>
