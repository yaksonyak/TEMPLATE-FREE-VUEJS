<!-- src/views/examens/CandidatsView.vue
     Objectif : suivre et traiter les candidatures aux examens (DEF, BAC, CAP, BT), régulières et libres.
     Endpoints : GET /candidats (examen, type_candidat, statut, annee_scolaire_id, serie_id, filiere_id,
                 etablissement_id, recherche), GET /candidats/{id}, POST …/valider, POST …/rejeter.
     Permissions : rôles de gestion, périmètre appliqué par l'API (agent CAP → DEF de son CAP,
     admin académie → BAC/CAP/BT, directeur → réguliers de son établissement) ;
     validation/rejet via canValidate('candidats') ; dépôt via canEdit('candidats'). -->
<template>
  <div class="space-y-4">
    <AppAlert v-if="succes" type="succes" :message="succes" fermable @fermer="succes = ''" />
    <AppAlert v-if="erreurAction" type="erreur" :message="erreurAction" fermable @fermer="erreurAction = ''" />

    <AppCard titre="Candidats aux examens" :sous-titre="`${pagination.total} candidature(s) dans votre périmètre`" sans-marge>
      <template #actions>
        <AppButton variante="outline" taille="sm" @click="reinitialiser">Réinitialiser</AppButton>
        <AppButton v-if="peutDeposer" taille="sm" @click="$router.push({ name: 'candidature-nouvelle' })">+ Nouvelle candidature</AppButton>
      </template>

      <div class="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
        <!-- Onglets examens -->
        <div class="flex flex-wrap gap-2" role="tablist" aria-label="Examen">
          <button v-for="o in optionsExamen" :key="o.valeur" type="button" role="tab" :aria-selected="params.examen === o.valeur"
                  class="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                  :class="params.examen === o.valeur ? 'bg-cnece-primary text-white border-cnece-primary' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'"
                  @click="params.examen = o.valeur; filtrer()">
            {{ o.libelle }}
          </button>
        </div>
        <EtablissementPicker v-model="params.etablissement_id" label="Établissement (candidats réguliers)" @update:model-value="filtrer" />
        <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select v-model="params.type_candidat" aria-label="Type" class="champ-filtre" @change="filtrer">
            <option value="">Réguliers et libres</option>
            <option value="regulier">Réguliers</option>
            <option value="libre">Libres</option>
          </select>
          <select v-model="params.statut" aria-label="Statut" class="champ-filtre" @change="filtrer">
            <option value="">Tous statuts</option>
            <option v-for="o in optionsStatut" :key="o.valeur" :value="o.valeur">{{ o.libelle }}</option>
          </select>
          <select v-if="params.examen === 'BAC' || !params.examen" v-model="params.serie_id" aria-label="Série" class="champ-filtre" @change="filtrer">
            <option value="">Toutes séries</option>
            <option v-for="s in optionsSeries" :key="s.valeur" :value="s.valeur">{{ s.libelle }}</option>
          </select>
          <select v-if="['CAP', 'BT'].includes(params.examen) || !params.examen" v-model="params.filiere_id" aria-label="Filière" class="champ-filtre" @change="filtrer">
            <option value="">Toutes filières</option>
            <option v-for="f in optionsFilieres(params.examen === 'CAP' || params.examen === 'BT' ? params.examen : null)" :key="f.valeur" :value="f.valeur">{{ f.libelle }}</option>
          </select>
          <select v-model="params.annee_scolaire_id" aria-label="Session" class="champ-filtre" @change="filtrer">
            <option value="">Toutes sessions</option>
            <option v-for="a in annees" :key="a.id" :value="a.id">{{ a.libelle }}</option>
          </select>
          <input v-model="params.recherche" type="search" placeholder="Matricule, nom, prénom…" aria-label="Rechercher" class="champ-filtre" />
        </div>
      </div>

      <AppTable :colonnes="colonnes" :lignes="elements" :chargement="chargement" :erreur="erreur"
                :tri="params.tri" :ordre="params.ordre" cliquable
                message-vide="Aucune candidature." @trier="trier" @reessayer="charger" @ligne-cliquee="ouvrirDetail">
        <template #cellule-eleve="{ ligne }">
          <p class="font-medium text-slate-800">{{ ligne.eleve?.prenom }} {{ ligne.eleve?.nom }}</p>
          <MatriculeBadge :matricule="ligne.eleve?.matricule" />
        </template>
        <template #cellule-examen="{ valeur, ligne }">
          <AppBadge :valeur="valeur" couleur="bleu" />
          <span v-if="ligne.serie" class="ml-1 text-xs text-slate-500">{{ ligne.serie.code }}</span>
          <span v-if="ligne.filiere" class="ml-1 text-xs text-slate-500">{{ ligne.filiere.code }}</span>
        </template>
        <template #cellule-type_candidat="{ valeur }"><AppBadge :valeur="valeur" famille="type_candidat" /></template>
        <template #cellule-lieu="{ ligne }">
          <span class="text-sm">{{ ligne.etablissement?.nom || ligne.cap?.nom || ligne.academie?.nom || '—' }}</span>
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
    <AppModal :ouvert="detail.ouvert" :titre="`Candidature n° ${detail.donnees?.id ?? ''}`" taille="lg" @fermer="detail.ouvert = false">
      <p v-if="detail.chargement" class="text-sm text-slate-500">Chargement…</p>
      <AppAlert v-else-if="detail.erreur" type="erreur" :message="detail.erreur" />
      <div v-else-if="detail.donnees" class="space-y-4 text-sm">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="font-semibold text-slate-800">{{ detail.donnees.eleve?.prenom }} {{ detail.donnees.eleve?.nom }}</p>
            <MatriculeBadge :matricule="detail.donnees.eleve?.matricule" />
          </div>
          <div class="flex gap-2">
            <AppBadge :valeur="detail.donnees.examen" couleur="bleu" />
            <AppBadge :valeur="detail.donnees.type_candidat" famille="type_candidat" />
            <AppBadge :valeur="detail.donnees.statut" famille="statut_validation" />
          </div>
        </div>
        <dl class="grid sm:grid-cols-2 gap-3">
          <div><dt class="text-slate-500">Session</dt><dd class="font-medium">{{ detail.donnees.annee_scolaire?.libelle || '—' }}</dd></div>
          <div><dt class="text-slate-500">Lieu</dt><dd class="font-medium">{{ detail.donnees.etablissement?.nom || detail.donnees.cap?.nom || detail.donnees.academie?.nom || '—' }}</dd></div>
          <div v-if="detail.donnees.serie"><dt class="text-slate-500">Série</dt><dd class="font-medium">{{ detail.donnees.serie.code }} — {{ detail.donnees.serie.libelle }}</dd></div>
          <div v-if="detail.donnees.filiere"><dt class="text-slate-500">Filière</dt><dd class="font-medium">{{ detail.donnees.filiere.code }} — {{ detail.donnees.filiere.libelle }}</dd></div>
          <div class="sm:col-span-2">
<dt class="text-slate-500">Pièces jointes</dt>
            <dd>
<span v-if="!detail.donnees.pieces_jointes?.length">—</span>
              <AppBadge v-for="p in detail.donnees.pieces_jointes" :key="p" :valeur="p.replaceAll('_', ' ')" couleur="gris" class="mr-1" />
</dd>
</div>
          <div><dt class="text-slate-500">Déposée le</dt><dd class="font-medium">{{ formaterDateHeure(detail.donnees.cree_le) }}</dd></div>
          <div v-if="detail.donnees.date_validation"><dt class="text-slate-500">Traitée le</dt><dd class="font-medium">{{ formaterDateHeure(detail.donnees.date_validation) }} <span v-if="detail.donnees.validateur" class="text-slate-500">par {{ detail.donnees.validateur.nom_complet }}</span></dd></div>
          <div v-if="detail.donnees.motif_rejet" class="sm:col-span-2"><dt class="text-slate-500">Motif du rejet</dt><dd class="text-cnece-danger">{{ detail.donnees.motif_rejet }}</dd></div>
        </dl>
        <router-link :to="{ name: 'eleve-detail', params: { id: detail.donnees.eleve_id || detail.donnees.eleve?.id } }" class="btn-outline inline-block text-sm">Fiche de l'élève</router-link>
      </div>
    </AppModal>

    <AppConfirmModal :ouvert="Boolean(confirmation.cible)" titre="Valider la candidature" libelle-confirmer="Valider" variante="success"
      :message="`Valider la candidature de ${confirmation.cible?.eleve?.prenom} ${confirmation.cible?.eleve?.nom} au ${confirmation.cible?.examen} ?`"
      :chargement="confirmation.chargement" @fermer="confirmation = { cible: null, chargement: false }" @confirmer="valider" />

    <MotifRejetModal :ouvert="Boolean(rejet.cible)" titre="Rejeter la candidature" :chargement="rejet.chargement" :erreur="rejet.erreur"
      @fermer="rejet = { cible: null, chargement: false, erreur: '' }" @confirmer="rejeter" />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import listeApi from '@/mixins/listeApi.js'
import candidatsService from '@/services/candidats.service.js'
import referentielsService from '@/services/referentiels.service.js'
import { useAuthStore } from '@/stores/auth.js'
import { useReferentielsStore } from '@/stores/referentiels.js'
import { canEdit, canValidate } from '@/utils/permissions.js'
import { optionsDepuis, formaterDateHeure } from '@/utils/format.js'

export default {
  name: 'CandidatsView',
  mixins: [listeApi],

  data() {
    return {
      colonnes: [
        { cle: 'eleve', libelle: 'Candidat' },
        { cle: 'examen', libelle: 'Examen', triable: true, classe: 'w-32' },
        { cle: 'type_candidat', libelle: 'Type', triable: true, classe: 'w-24' },
        { cle: 'lieu', libelle: 'Établissement / lieu de dépôt' },
        { cle: 'annee_scolaire.libelle', libelle: 'Session', classe: 'w-24' },
        { cle: 'created_at', libelle: 'Déposée le', triable: true, classe: 'w-36', format: (v, l) => formaterDateHeure(l.cree_le || v) },
        { cle: 'statut', libelle: 'Statut', triable: true, classe: 'w-28' },
      ],
      optionsExamen: [{ valeur: '', libelle: 'Tous' }, ...optionsDepuis('examen')],
      optionsStatut: optionsDepuis('statut_validation'),
      annees: [],
      succes: '',
      erreurAction: '',
      detail: { ouvert: false, chargement: false, erreur: '', donnees: null },
      confirmation: { cible: null, chargement: false },
      rejet: { cible: null, chargement: false, erreur: '' },
    }
  },

  computed: {
    ...mapState(useAuthStore, ['role']),
    ...mapState(useReferentielsStore, ['optionsSeries', 'optionsFilieres']),
    peutDeposer() {
      return canEdit('candidats', this.role)
    },
    peutValider() {
      return canValidate('candidats', this.role)
    },
  },

  async created() {
    this.chargerTout()
    this.annees = (await referentielsService.listerAnneesScolaires({ par_page: 100, tri: 'libelle', ordre: 'desc' }).catch(() => ({ elements: [] }))).elements
  },

  methods: {
    ...mapActions(useReferentielsStore, ['chargerTout']),
    formaterDateHeure,
    filtresInitiaux() {
      return { examen: '', type_candidat: '', statut: '', serie_id: '', filiere_id: '', etablissement_id: '', annee_scolaire_id: '' }
    },
    chargerElements(params) {
      return candidatsService.lister(params)
    },

    async ouvrirDetail(candidat) {
      this.detail = { ouvert: true, chargement: true, erreur: '', donnees: null }
      try {
        this.detail.donnees = await candidatsService.detail(candidat.id)
      } catch (e) {
        this.detail.erreur = e.message
      } finally {
        this.detail.chargement = false
      }
    },

    async valider() {
      this.confirmation.chargement = true
      try {
        await candidatsService.valider(this.confirmation.cible.id)
        this.succes = 'Candidature validée.'
        await this.charger()
      } catch (e) {
        this.erreurAction = e.message
      } finally {
        this.confirmation = { cible: null, chargement: false }
      }
    },
    async rejeter(motif) {
      this.rejet.chargement = true
      this.rejet.erreur = ''
      try {
        await candidatsService.rejeter(this.rejet.cible.id, motif)
        this.succes = 'Candidature rejetée.'
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
