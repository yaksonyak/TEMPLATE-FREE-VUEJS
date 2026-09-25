<!-- src/views/eleves/EleveDetailView.vue
     Objectif : la fiche complète d'un élève — état civil, inscription en cours, historique
     des inscriptions et des candidatures — et les actions du cycle de vie :
       - modifier l'état civil  (PUT /eleves/{id}, matricule jamais modifiable, statut inactif = « suppression »)
       - réinscrire              (POST /eleves/{id}/reinscription : admis | redoublant, changement
                                  d'établissement possible → passage 9ème → lycée)
       - demander un transfert   (redirige vers la page Transferts avec l'élève présélectionné)
     Endpoints : GET /eleves/{id}, PUT /eleves/{id}, POST /eleves/{id}/reinscription.
     Permissions : rôles de gestion, élève dans le périmètre (403 sinon) ; actions via canEdit('eleves'). -->
<template>
  <div class="space-y-4">
    <p v-if="chargement" class="text-sm text-slate-500">Chargement de la fiche…</p>
    <AppAlert v-else-if="erreur" type="erreur" :message="erreur" />

    <template v-else-if="eleve">
      <AppAlert v-if="succes" type="succes" :message="succes" fermable @fermer="succes = ''" />
      <AppAlert v-if="avertissements.length" type="avertissement" :message="avertissements.join(' ')" fermable @fermer="avertissements = []" />

      <!-- ===================== En-tête ===================== -->
      <AppCard>
        <div class="flex flex-col lg:flex-row lg:items-center gap-4">
          <div class="h-16 w-16 rounded-full bg-cnece-secondary text-cnece-primary flex items-center justify-center text-xl font-bold shrink-0" aria-hidden="true">
            {{ initiales }}
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-xl font-bold text-slate-800">{{ eleve.prenom }} {{ eleve.nom }}</h2>
            <p class="text-sm text-slate-500 mt-0.5">
              {{ libelle('sexe', eleve.sexe) }} · né(e) le {{ formaterDate(eleve.date_naissance) }} à {{ eleve.lieu_naissance || '—' }}
              <span v-if="age !== null"> · {{ age }} ans</span>
            </p>
            <div class="flex flex-wrap items-center gap-2 mt-2">
              <MatriculeBadge :matricule="eleve.matricule" />
              <AppBadge :valeur="eleve.statut" famille="statut" />
              <AppBadge v-if="inscriptionActive" :valeur="inscriptionActive.statut" famille="statut_inscription" />
              <span v-else class="text-xs text-slate-500">Aucune inscription sur l'année active</span>
            </div>
          </div>
          <div v-if="peutEditer" class="flex flex-wrap gap-2">
            <AppButton variante="outline" @click="ouvrirModification">Modifier l'état civil</AppButton>
            <AppButton v-if="eleve.statut === 'actif'" variante="success" @click="ouvrirReinscription">Réinscrire</AppButton>
            <AppButton v-if="inscriptionActive" @click="demanderTransfert">Demander un transfert</AppButton>
          </div>
        </div>
      </AppCard>

      <div class="grid lg:grid-cols-3 gap-4">
        <!-- ===================== Inscription en cours ===================== -->
        <AppCard titre="Inscription en cours" :sous-titre="inscriptionActive?.annee_scolaire?.libelle || ''">
          <dl v-if="inscriptionActive" class="space-y-2 text-sm">
            <div><dt class="text-slate-500">Établissement</dt><dd class="font-medium">{{ inscriptionActive.etablissement?.nom }}</dd></div>
            <div><dt class="text-slate-500">Ordre</dt><dd><AppBadge :valeur="inscriptionActive.etablissement?.ordre" famille="ordre" couleur="bleu" /></dd></div>
            <div><dt class="text-slate-500">Niveau</dt><dd class="font-medium">{{ libelleNiveau(inscriptionActive.niveau) }}</dd></div>
            <div v-if="inscriptionActive.serie"><dt class="text-slate-500">Série</dt><dd class="font-medium">{{ inscriptionActive.serie.code }} — {{ inscriptionActive.serie.libelle }}</dd></div>
            <div v-if="inscriptionActive.filiere"><dt class="text-slate-500">Filière</dt><dd class="font-medium">{{ inscriptionActive.filiere.code }} — {{ inscriptionActive.filiere.libelle }}</dd></div>
            <div><dt class="text-slate-500">Date d'inscription</dt><dd class="font-medium">{{ formaterDate(inscriptionActive.date_inscription) }}</dd></div>
          </dl>
          <p v-else class="text-sm text-slate-500">Cet élève n'est pas inscrit sur l'année active. Utilisez « Réinscrire ».</p>
        </AppCard>

        <!-- ===================== État civil ===================== -->
        <AppCard titre="État civil et contacts" class="lg:col-span-2">
          <dl class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <div><dt class="text-slate-500">N° acte de naissance</dt><dd class="font-medium">{{ eleve.numero_acte_naissance || '—' }}</dd></div>
            <div><dt class="text-slate-500">Père</dt><dd class="font-medium">{{ nomComplet(eleve.prenom_pere, eleve.nom_pere) }}</dd></div>
            <div><dt class="text-slate-500">Contact du père</dt><dd class="font-medium">{{ eleve.contact_pere || '—' }}</dd></div>
            <div><dt class="text-slate-500">Mère</dt><dd class="font-medium">{{ nomComplet(eleve.prenom_mere, eleve.nom_mere) }}</dd></div>
            <div><dt class="text-slate-500">Contact de la mère</dt><dd class="font-medium">{{ eleve.contact_mere || '—' }}</dd></div>
            <div><dt class="text-slate-500">Tuteur</dt><dd class="font-medium">{{ eleve.tuteur || '—' }} <span v-if="eleve.contact_tuteur" class="text-slate-500">· {{ eleve.contact_tuteur }}</span></dd></div>
            <div><dt class="text-slate-500">Créé le</dt><dd class="font-medium">{{ formaterDateHeure(eleve.cree_le) }}</dd></div>
            <div><dt class="text-slate-500">Modifié le</dt><dd class="font-medium">{{ formaterDateHeure(eleve.modifie_le) }}</dd></div>
          </dl>
        </AppCard>
      </div>

      <!-- ===================== Historique ===================== -->
      <AppCard titre="Historique des inscriptions" :sous-titre="`${(eleve.inscriptions || []).length} inscription(s)`" sans-marge>
        <AppTable :colonnes="colonnesInscriptions" :lignes="eleve.inscriptions || []" message-vide="Aucune inscription.">
          <template #cellule-niveau="{ valeur }">{{ libelleNiveau(valeur) }}</template>
          <template #cellule-statut="{ valeur }"><AppBadge :valeur="valeur" famille="statut_inscription" /></template>
        </AppTable>
      </AppCard>

      <AppCard titre="Candidatures aux examens" :sous-titre="`${(eleve.candidatures || []).length} candidature(s)`" sans-marge>
        <AppTable :colonnes="colonnesCandidatures" :lignes="eleve.candidatures || []" message-vide="Aucune candidature.">
          <template #cellule-examen="{ valeur }"><AppBadge :valeur="valeur" couleur="bleu" /></template>
          <template #cellule-type_candidat="{ valeur }"><AppBadge :valeur="valeur" famille="type_candidat" /></template>
          <template #cellule-statut="{ valeur }"><AppBadge :valeur="valeur" famille="statut_validation" /></template>
        </AppTable>
      </AppCard>

      <!-- ===================== Modale : état civil ===================== -->
      <AppModal :ouvert="modif.ouvert" titre="Modifier l'état civil" taille="xl" @fermer="modif.ouvert = false">
        <form id="form-modif" class="space-y-5" @submit.prevent="enregistrerModification">
          <AppAlert v-if="modif.erreur" type="erreur" :message="modif.erreur" />
          <EtatCivilFields v-model="modif.donnees" :erreurs="modif.erreurs" />
          <div class="grid sm:grid-cols-3 gap-4">
            <AppSelect v-model="modif.donnees.statut" label="Statut de l'élève" :options="optionsStatut" obligatoire
                       aide="« Inactif » remplace la suppression (RG-7)" :erreur="modif.erreurs.statut" />
          </div>
        </form>
        <template #pied>
          <AppButton variante="outline" :disabled="modif.chargement" @click="modif.ouvert = false">Annuler</AppButton>
          <AppButton type="submit" form="form-modif" :chargement="modif.chargement">Enregistrer</AppButton>
        </template>
      </AppModal>

      <!-- ===================== Modale : réinscription ===================== -->
      <AppModal :ouvert="reinsc.ouvert" titre="Réinscrire l'élève sur l'année active" taille="lg" @fermer="reinsc.ouvert = false">
        <form id="form-reinsc" class="space-y-4" @submit.prevent="enregistrerReinscription">
          <AppAlert v-if="reinsc.erreur" type="erreur" :message="reinsc.erreur" />
          <p class="text-sm text-slate-600">
            Dernière inscription : <span class="font-medium">{{ derniereInscription?.etablissement?.nom || '—' }}</span>,
            {{ libelleNiveau(derniereInscription?.niveau) }} ({{ derniereInscription?.annee_scolaire?.libelle || '—' }}).
            Le passage de la 9ème au lycée est une nouvelle inscription, pas un transfert.
          </p>
          <div class="grid sm:grid-cols-2 gap-4">
            <AppSelect v-model="reinsc.statut" label="Résultat de l'année précédente" :options="optionsStatutReinscription" obligatoire :erreur="reinsc.erreurs.statut" />
          </div>
          <InscriptionFields v-model="reinsc.inscription" :erreurs="reinsc.erreurs" :etablissement-obligatoire="false" />
        </form>
        <template #pied>
          <AppButton variante="outline" :disabled="reinsc.chargement" @click="reinsc.ouvert = false">Annuler</AppButton>
          <AppButton type="submit" form="form-reinsc" variante="success" :chargement="reinsc.chargement">Réinscrire</AppButton>
        </template>
      </AppModal>
    </template>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import elevesService from '@/services/eleves.service.js'
import { useAuthStore } from '@/stores/auth.js'
import { useReferentielsStore } from '@/stores/referentiels.js'
import { canEdit } from '@/utils/permissions.js'
import { ETAT_CIVIL_VIDE } from '@/components/forms/EtatCivilFields.vue'
import { INSCRIPTION_VIDE } from '@/components/forms/InscriptionFields.vue'
import { formaterDate, formaterDateHeure, libelle, libelleNiveau, optionsDepuis } from '@/utils/format.js'

export default {
  name: 'EleveDetailView',
  props: {
    id: { type: [String, Number], required: true }, // vient de l'URL (/eleves/:id, props: true)
  },

  data() {
    return {
      eleve: null,
      chargement: true,
      erreur: '',
      succes: '',
      avertissements: [],
      optionsStatut: optionsDepuis('statut'),
      optionsStatutReinscription: [
        { valeur: 'admis', libelle: 'Admis (passage au niveau suivant)' },
        { valeur: 'redoublant', libelle: 'Redoublant (même niveau)' },
      ],
      colonnesInscriptions: [
        { cle: 'annee_scolaire.libelle', libelle: 'Année', classe: 'w-28' },
        { cle: 'etablissement.nom', libelle: 'Établissement' },
        { cle: 'niveau', libelle: 'Niveau', classe: 'w-24' },
        { cle: 'serie.code', libelle: 'Série', classe: 'w-20' },
        { cle: 'filiere.code', libelle: 'Filière', classe: 'w-24' },
        { cle: 'statut', libelle: 'Statut', classe: 'w-28' },
        { cle: 'date_inscription', libelle: 'Inscrit le', classe: 'w-28', format: formaterDate },
      ],
      colonnesCandidatures: [
        { cle: 'annee_scolaire.libelle', libelle: 'Session', classe: 'w-28' },
        { cle: 'examen', libelle: 'Examen', classe: 'w-24' },
        { cle: 'type_candidat', libelle: 'Type', classe: 'w-28' },
        { cle: 'etablissement.nom', libelle: 'Établissement / lieu de dépôt', format: (v, l) => v || l.cap?.nom || l.academie?.nom || '—' },
        { cle: 'statut', libelle: 'Statut', classe: 'w-28' },
        { cle: 'motif_rejet', libelle: 'Motif de rejet' },
      ],
      modif: { ouvert: false, donnees: { ...ETAT_CIVIL_VIDE(), statut: 'actif' }, chargement: false, erreur: '', erreurs: {} },
      reinsc: { ouvert: false, statut: 'admis', inscription: INSCRIPTION_VIDE(), chargement: false, erreur: '', erreurs: {} },
    }
  },

  computed: {
    ...mapState(useAuthStore, ['role']),
    peutEditer() {
      return canEdit('eleves', this.role)
    },
    initiales() {
      return `${this.eleve.prenom?.[0] || ''}${this.eleve.nom?.[0] || ''}`.toUpperCase()
    },
    age() {
      if (!this.eleve.date_naissance) return null
      const naissance = new Date(this.eleve.date_naissance)
      const diff = Date.now() - naissance.getTime()
      return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
    },
    inscriptionActive() {
      return this.eleve.inscription_active || null
    },
    /** La plus récente (l'API renvoie l'historique complet). */
    derniereInscription() {
      const liste = this.eleve.inscriptions || []
      return this.inscriptionActive || liste[0] || null
    },
  },

  created() {
    this.chargerTout()
    this.charger()
  },

  methods: {
    ...mapActions(useReferentielsStore, ['chargerTout']),
    formaterDate,
    formaterDateHeure,
    libelle,
    libelleNiveau,
    nomComplet(prenom, nom) {
      return [prenom, nom].filter(Boolean).join(' ') || '—'
    },

    async charger() {
      this.chargement = true
      this.erreur = ''
      try {
        this.eleve = await elevesService.detail(this.id)
      } catch (e) {
        this.erreur = e.statut === 403 ? 'Cet élève est hors de votre périmètre.' : e.message
      } finally {
        this.chargement = false
      }
    },

    // ------------------------------------------------ état civil
    ouvrirModification() {
      const donnees = { ...ETAT_CIVIL_VIDE(), statut: this.eleve.statut }
      Object.keys(donnees).forEach((cle) => (donnees[cle] = this.eleve[cle] ?? ''))
      this.modif = { ouvert: true, donnees, chargement: false, erreur: '', erreurs: {} }
    },
    async enregistrerModification() {
      this.modif.chargement = true
      this.modif.erreur = ''
      this.modif.erreurs = {}
      const corps = Object.fromEntries(Object.entries(this.modif.donnees).filter(([, v]) => v !== ''))
      try {
        this.eleve = await elevesService.modifier(this.eleve.id, corps)
        this.succes = 'État civil mis à jour.'
        this.modif.ouvert = false
      } catch (e) {
        this.modif.erreur = e.message
        this.modif.erreurs = e.erreurs || {}
      } finally {
        this.modif.chargement = false
      }
    },

    // ------------------------------------------------ réinscription
    ouvrirReinscription() {
      this.reinsc = {
        ouvert: true,
        statut: 'admis',
        // Établissement par défaut = dernier établissement (comportement de l'API si absent)
        inscription: { ...INSCRIPTION_VIDE(), etablissement_id: this.derniereInscription?.etablissement_id || this.derniereInscription?.etablissement?.id || '' },
        chargement: false, erreur: '', erreurs: {},
      }
    },
    async enregistrerReinscription() {
      this.reinsc.chargement = true
      this.reinsc.erreur = ''
      this.reinsc.erreurs = {}
      const corps = Object.fromEntries(
        Object.entries({ ...this.reinsc.inscription, statut: this.reinsc.statut }).filter(([, v]) => v !== '' && v !== null)
      )
      try {
        const resultat = await elevesService.reinscrire(this.eleve.id, corps)
        this.avertissements = resultat.avertissements || []
        this.succes = `Réinscription enregistrée en ${libelleNiveau(resultat.inscription?.niveau)}.`
        this.reinsc.ouvert = false
        await this.charger() // recharge l'historique
      } catch (e) {
        // 422 : déjà inscrit sur l'année active, niveau incohérent… ; 409 : aucune année active
        this.reinsc.erreur = e.message
        this.reinsc.erreurs = e.erreurs || {}
      } finally {
        this.reinsc.chargement = false
      }
    },

    // ------------------------------------------------ transfert
    demanderTransfert() {
      this.$router.push({
        name: 'transferts',
        query: { nouveau: 1, eleve_id: this.eleve.id, etablissement_origine_id: this.inscriptionActive.etablissement_id || this.inscriptionActive.etablissement?.id },
      })
    },
  },
}
</script>
