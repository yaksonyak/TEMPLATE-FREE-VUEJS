<!-- src/views/eleves/TransfertsView.vue
     Objectif : suivre et traiter les transferts d'élèves entre établissements (RG-6).
       - Demander : l'élève doit être inscrit dans l'origine sur l'année active ; l'accueil doit être actif,
         du même ordre et compatible (niveau, série, filière) ; une seule demande en attente par élève.
       - Valider : l'inscription d'origine passe à `transfere`, une inscription est créée à l'accueil.
       - Rejeter : motif obligatoire.
     Endpoints : GET /transferts, GET /transferts/{id}, POST /transferts, POST …/valider, POST …/rejeter.
     Permissions : rôles de gestion (origine OU accueil dans le périmètre) ; demande via canEdit('transferts'),
     validation/rejet via canValidate('transferts') = agent_cap, admin_academie, admin_national.
     Arrivée depuis la fiche élève : ?nouveau=1&eleve_id=…&etablissement_origine_id=… ouvre la demande préremplie. -->
<template>
  <div class="space-y-4">
    <AppAlert v-if="succes" type="succes" :message="succes" fermable @fermer="succes = ''" />
    <AppAlert v-if="erreurAction" type="erreur" :message="erreurAction" fermable @fermer="erreurAction = ''" />

    <AppCard titre="Transferts" :sous-titre="`${pagination.total} demande(s) dans votre périmètre`" sans-marge>
      <template #actions>
        <AppButton variante="outline" taille="sm" @click="reinitialiser">Réinitialiser</AppButton>
        <AppButton v-if="peutDemander" taille="sm" @click="ouvrirDemande()">+ Nouvelle demande</AppButton>
      </template>

      <div class="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
        <EtablissementPicker v-model="params.etablissement_id" label="Établissement (origine ou accueil)" @update:model-value="filtrer" />
        <div class="grid sm:grid-cols-3 gap-3">
          <select v-model="params.statut" aria-label="Statut" class="champ-filtre" @change="filtrer">
            <option value="">Tous statuts</option>
            <option v-for="o in optionsStatut" :key="o.valeur" :value="o.valeur">{{ o.libelle }}</option>
          </select>
          <select v-model="params.annee_scolaire_id" aria-label="Année scolaire" class="champ-filtre" @change="filtrer">
            <option value="">Toutes les années</option>
            <option v-for="a in annees" :key="a.id" :value="a.id">{{ a.libelle }}</option>
          </select>
          <input v-model="params.recherche" type="search" placeholder="Matricule, nom, prénom de l'élève…" aria-label="Rechercher" class="champ-filtre" />
        </div>
      </div>

      <AppTable :colonnes="colonnes" :lignes="elements" :chargement="chargement" :erreur="erreur"
                :tri="params.tri" :ordre="params.ordre" cliquable
                message-vide="Aucun transfert." @trier="trier" @reessayer="charger" @ligne-cliquee="ouvrirDetail">
        <template #cellule-eleve="{ ligne }">
          <p class="font-medium text-slate-800">{{ ligne.eleve?.prenom }} {{ ligne.eleve?.nom }}</p>
          <MatriculeBadge :matricule="ligne.eleve?.matricule" />
        </template>
        <template #cellule-trajet="{ ligne }">
          <p class="text-xs text-slate-500">De</p><p class="text-sm">{{ ligne.etablissement_origine?.nom }}</p>
          <p class="text-xs text-slate-500 mt-1">Vers</p><p class="text-sm font-medium">{{ ligne.etablissement_accueil?.nom }}</p>
        </template>
        <template #cellule-statut="{ valeur }"><AppBadge :valeur="valeur" famille="statut_validation" /></template>
        <template #actions="{ ligne }">
          <div class="inline-flex gap-1">
            <AppIconButton action="voir" titre="Voir" @click="ouvrirDetail(ligne)" />
            <template v-if="peutValider && ligne.statut === 'en_attente'">
              <AppIconButton action="valider" titre="Valider" @click="confirmation = { cible: ligne, chargement: false }" />
              <AppIconButton action="rejeter" titre="Rejeter" @click="rejet = { cible: ligne, chargement: false, erreur: '' }" />
            </template>
          </div>
        </template>
      </AppTable>

      <template #pied>
        <AppPagination :pagination="pagination" @changer-page="changerPage" @changer-taille="changerTaille" />
      </template>
    </AppCard>

    <!-- ===================== Détail ===================== -->
    <AppModal :ouvert="detail.ouvert" :titre="`Transfert n° ${detail.donnees?.id ?? ''}`" taille="lg" @fermer="detail.ouvert = false">
      <p v-if="detail.chargement" class="text-sm text-slate-500">Chargement…</p>
      <AppAlert v-else-if="detail.erreur" type="erreur" :message="detail.erreur" />
      <div v-else-if="detail.donnees" class="space-y-4 text-sm">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="font-semibold text-slate-800">{{ detail.donnees.eleve?.prenom }} {{ detail.donnees.eleve?.nom }}</p>
            <MatriculeBadge :matricule="detail.donnees.eleve?.matricule" />
          </div>
          <AppBadge :valeur="detail.donnees.statut" famille="statut_validation" />
        </div>
        <dl class="grid sm:grid-cols-2 gap-3">
          <div><dt class="text-slate-500">Établissement d'origine</dt><dd class="font-medium">{{ detail.donnees.etablissement_origine?.nom }}</dd></div>
          <div><dt class="text-slate-500">Établissement d'accueil</dt><dd class="font-medium">{{ detail.donnees.etablissement_accueil?.nom }}</dd></div>
          <div><dt class="text-slate-500">Année scolaire</dt><dd class="font-medium">{{ detail.donnees.annee_scolaire?.libelle || '—' }}</dd></div>
          <div><dt class="text-slate-500">Demandé le</dt><dd class="font-medium">{{ formaterDateHeure(detail.donnees.cree_le) }} <span v-if="detail.donnees.demandeur" class="text-slate-500">par {{ detail.donnees.demandeur.nom_complet }}</span></dd></div>
          <div class="sm:col-span-2"><dt class="text-slate-500">Motif</dt><dd>{{ detail.donnees.motif }}</dd></div>
          <div v-if="detail.donnees.date_validation"><dt class="text-slate-500">Traité le</dt><dd class="font-medium">{{ formaterDateHeure(detail.donnees.date_validation) }} <span v-if="detail.donnees.validateur" class="text-slate-500">par {{ detail.donnees.validateur.nom_complet }}</span></dd></div>
          <div v-if="detail.donnees.motif_rejet" class="sm:col-span-2"><dt class="text-slate-500">Motif du rejet</dt><dd class="text-cnece-danger">{{ detail.donnees.motif_rejet }}</dd></div>
        </dl>
        <router-link :to="{ name: 'eleve-detail', params: { id: detail.donnees.eleve_id || detail.donnees.eleve?.id } }" class="btn-outline inline-block text-sm">Fiche de l'élève</router-link>
      </div>
    </AppModal>

    <!-- ===================== Nouvelle demande ===================== -->
    <AppModal :ouvert="demande.ouvert" titre="Demander un transfert" taille="lg" @fermer="demande.ouvert = false">
      <form id="form-transfert" class="space-y-4" @submit.prevent="enregistrerDemande">
        <AppAlert v-if="demande.erreur" type="erreur" :message="demande.erreur" :erreurs="demande.erreurs" />

        <EleveSearchField v-model="demande.eleve" obligatoire :disabled="demande.chargement" />

        <template v-if="demande.eleve">
          <div class="rounded-lg border border-slate-200 p-3 text-sm bg-slate-50">
            <p class="text-slate-500 text-xs">Établissement d'origine (inscription en cours)</p>
            <p v-if="origine" class="font-medium">{{ origine.nom }} <AppBadge :valeur="origine.ordre" famille="ordre" couleur="bleu" class="ml-2" /></p>
            <p v-else class="text-cnece-danger">Cet élève n'a pas d'inscription en cours : un transfert est impossible (réinscrivez-le d'abord).</p>
          </div>

          <EtablissementPicker v-if="origine" v-model="demande.etablissement_accueil_id" label="Établissement d'accueil"
                               :ordre="origine.ordre" obligatoire :erreur="demande.erreurs.etablissement_accueil_id" />

          <div>
            <label for="motif" class="block text-sm font-medium text-slate-700 mb-1">Motif <span class="text-cnece-danger">*</span></label>
            <textarea id="motif" v-model.trim="demande.motif" rows="3" required
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cnece-accent"
                      placeholder="Ex. Déménagement de la famille à Lafiabougou." />
            <p v-if="demande.erreurs.motif" class="mt-1 text-xs text-cnece-danger">{{ demande.erreurs.motif[0] }}</p>
          </div>
        </template>
      </form>
      <template #pied>
        <AppButton variante="outline" :disabled="demande.chargement" @click="demande.ouvert = false">Annuler</AppButton>
        <AppButton type="submit" form="form-transfert" :chargement="demande.chargement" :disabled="!origine || !demande.etablissement_accueil_id || !demande.motif">Envoyer la demande</AppButton>
      </template>
    </AppModal>

    <!-- ===================== Validation / rejet ===================== -->
    <AppConfirmModal :ouvert="Boolean(confirmation.cible)" titre="Valider le transfert" libelle-confirmer="Valider" variante="success"
      :message="`Valider le transfert de ${confirmation.cible?.eleve?.prenom} ${confirmation.cible?.eleve?.nom} vers ${confirmation.cible?.etablissement_accueil?.nom} ? L’inscription d’origine passera à « transféré » et une inscription sera créée à l’accueil.`"
      :chargement="confirmation.chargement" @fermer="confirmation = { cible: null, chargement: false }" @confirmer="valider" />

    <MotifRejetModal :ouvert="Boolean(rejet.cible)" titre="Rejeter le transfert" :chargement="rejet.chargement" :erreur="rejet.erreur"
      @fermer="rejet = { cible: null, chargement: false, erreur: '' }" @confirmer="rejeter" />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import listeApi from '@/mixins/listeApi.js'
import transfertsService from '@/services/transferts.service.js'
import elevesService from '@/services/eleves.service.js'
import referentielsService from '@/services/referentiels.service.js'
import { useAuthStore } from '@/stores/auth.js'
import { canEdit, canValidate } from '@/utils/permissions.js'
import { optionsDepuis, formaterDateHeure } from '@/utils/format.js'

const DEMANDE_VIDE = () => ({ ouvert: false, eleve: null, etablissement_accueil_id: '', motif: '', chargement: false, erreur: '', erreurs: {} })

export default {
  name: 'TransfertsView',
  mixins: [listeApi],

  data() {
    return {
      colonnes: [
        { cle: 'eleve', libelle: 'Élève' },
        { cle: 'trajet', libelle: 'Origine → Accueil' },
        { cle: 'motif', libelle: 'Motif', classe: 'max-w-xs truncate' },
        { cle: 'created_at', libelle: 'Demandé le', triable: true, classe: 'w-36', format: (v, l) => formaterDateHeure(l.cree_le || v) },
        { cle: 'statut', libelle: 'Statut', triable: true, classe: 'w-28' },
      ],
      optionsStatut: optionsDepuis('statut_validation'),
      annees: [],
      succes: '',
      erreurAction: '',
      detail: { ouvert: false, chargement: false, erreur: '', donnees: null },
      demande: DEMANDE_VIDE(),
      confirmation: { cible: null, chargement: false },
      rejet: { cible: null, chargement: false, erreur: '' },
    }
  },

  computed: {
    ...mapState(useAuthStore, ['role']),
    peutDemander() {
      return canEdit('transferts', this.role)
    },
    peutValider() {
      return canValidate('transferts', this.role)
    },
    /** Établissement d'origine = celui de l'inscription en cours de l'élève choisi. */
    origine() {
      const insc = this.demande.eleve?.inscription_active || this.demande.eleve?.inscriptions?.find((i) => i.annee_scolaire?.active)
      return insc?.etablissement || null
    },
  },

  async created() {
    this.annees = (await referentielsService.listerAnneesScolaires({ par_page: 100, tri: 'libelle', ordre: 'desc' }).catch(() => ({ elements: [] }))).elements
    // Ouverture directe depuis la fiche élève
    if (this.$route.query.nouveau && this.$route.query.eleve_id && this.peutDemander) {
      this.ouvrirDemande(Number(this.$route.query.eleve_id))
    }
  },

  methods: {
    formaterDateHeure,
    filtresInitiaux() {
      return { statut: '', etablissement_id: '', annee_scolaire_id: '' }
    },
    chargerElements(params) {
      return transfertsService.lister(params)
    },

    async ouvrirDetail(transfert) {
      this.detail = { ouvert: true, chargement: true, erreur: '', donnees: null }
      try {
        this.detail.donnees = await transfertsService.detail(transfert.id)
      } catch (e) {
        this.detail.erreur = e.message
      } finally {
        this.detail.chargement = false
      }
    },

    // ------------------------------------------------ demande
    async ouvrirDemande(eleveId = null) {
      this.demande = { ...DEMANDE_VIDE(), ouvert: true }
      if (eleveId) {
        // Préremplissage : on charge la fiche pour connaître l'inscription en cours
        try {
          this.demande.eleve = await elevesService.detail(eleveId)
        } catch (e) {
          this.demande.erreur = e.message
        }
      }
    },
    async enregistrerDemande() {
      this.demande.chargement = true
      this.demande.erreur = ''
      this.demande.erreurs = {}
      try {
        await transfertsService.demander({
          eleve_id: this.demande.eleve.id,
          etablissement_origine_id: this.origine.id,
          etablissement_accueil_id: this.demande.etablissement_accueil_id,
          motif: this.demande.motif,
        })
        this.succes = `Demande de transfert envoyée pour ${this.demande.eleve.prenom} ${this.demande.eleve.nom}.`
        this.demande.ouvert = false
        // Nettoie l'URL (?nouveau=…) pour ne pas rouvrir la modale au rechargement
        if (this.$route.query.nouveau) this.$router.replace({ name: 'transferts' })
        await this.charger()
      } catch (e) {
        // 409 : demande déjà en attente ; 422 : ordre différent, accueil incompatible…
        this.demande.erreur = e.message
        this.demande.erreurs = e.erreurs || {}
      } finally {
        this.demande.chargement = false
      }
    },

    // ------------------------------------------------ validation / rejet
    async valider() {
      this.confirmation.chargement = true
      try {
        await transfertsService.valider(this.confirmation.cible.id)
        this.succes = 'Transfert validé : la nouvelle inscription a été créée.'
        await this.charger()
      } catch (e) {
        this.erreurAction = e.message // 403 hors périmètre, 409 déjà traité
      } finally {
        this.confirmation = { cible: null, chargement: false }
      }
    },
    async rejeter(motif) {
      this.rejet.chargement = true
      this.rejet.erreur = ''
      try {
        await transfertsService.rejeter(this.rejet.cible.id, motif)
        this.succes = 'Transfert rejeté.'
        this.rejet = { cible: null, chargement: false, erreur: '' }
        await this.charger()
      } catch (e) {
        this.rejet.erreur = e.message
        this.rejet.chargement = false
      }
    },
  },
}
</script>
