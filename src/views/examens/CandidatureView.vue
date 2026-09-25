<!-- src/views/examens/CandidatureView.vue
     Objectif : déposer une candidature à un examen national (RG-5).
       - Régulier : élève inscrit sur l'année active dans l'établissement (9ème → DEF, 12ème + série → BAC,
         dernière année de filière → CAP/BT). Body : examen, type_candidat, etablissement_id, eleve_id (+ serie_id/filiere_id).
       - Libre : dépôt au CAP (DEF) ou à l'académie (BAC/CAP/BT). Élève désigné par matricule OU créé
         à partir de son état civil (matricule généré avec le code du CAP, ou « 00 » pour l'académie).
     Endpoints : POST /candidats ; GET /eleves/recherche, /academies, /caps, /etablissements, /series, /filieres.
     Permissions : rôles de gestion (canEdit('candidats')). Restrictions par rôle appliquées dans le formulaire :
       agent_cap → DEF uniquement ; admin_academie → BAC/CAP/BT ; directeur → candidats réguliers de son établissement.
     409 si l'élève a déjà une candidature à cet examen pour la session. -->
<template>
  <div class="max-w-4xl mx-auto space-y-4">
    <!-- ===================== Succès (une seule candidature) ===================== -->
    <AppCard v-if="resultat" titre="Candidature enregistrée" sous-titre="Elle est en attente de validation">
      <dl class="grid sm:grid-cols-2 gap-3 text-sm">
        <div><dt class="text-slate-500">Candidat</dt><dd class="font-medium">{{ resultat.eleve?.prenom }} {{ resultat.eleve?.nom }} <MatriculeBadge :matricule="resultat.eleve?.matricule" class="ml-1" /></dd></div>
        <div><dt class="text-slate-500">Examen</dt><dd><AppBadge :valeur="resultat.examen" couleur="bleu" /> <AppBadge :valeur="resultat.type_candidat" famille="type_candidat" class="ml-1" /></dd></div>
        <div><dt class="text-slate-500">Session</dt><dd class="font-medium">{{ resultat.annee_scolaire?.libelle || '—' }}</dd></div>
        <div><dt class="text-slate-500">Lieu</dt><dd class="font-medium">{{ resultat.etablissement?.nom || resultat.cap?.nom || resultat.academie?.nom || '—' }}</dd></div>
      </dl>
      <template #pied>
        <div class="flex flex-wrap gap-2 justify-end">
          <AppButton variante="outline" @click="reinitialiser">Déposer une autre candidature</AppButton>
          <AppButton @click="$router.push({ name: 'candidats' })">Voir la liste des candidats</AppButton>
        </div>
      </template>
    </AppCard>

    <!-- ===================== Succès (dépôt groupé) ===================== -->
    <AppCard v-else-if="resultatsMultiples" :titre="`${succesMultiples} candidature(s) déposée(s) sur ${resultatsMultiples.length}`"
             sous-titre="Chaque candidature déposée est en attente de validation">
      <ul class="divide-y divide-slate-100">
        <li v-for="r in resultatsMultiples" :key="r.eleve.id" class="flex items-center justify-between gap-3 py-2.5 text-sm">
          <div class="min-w-0">
            <p class="font-medium text-slate-800 truncate">{{ r.eleve.prenom }} {{ r.eleve.nom }}</p>
            <MatriculeBadge :matricule="r.eleve.matricule" />
          </div>
          <AppBadge v-if="r.ok" valeur="Déposée" couleur="vert" />
          <span v-else class="text-xs text-cnece-danger text-right max-w-xs">{{ r.message }}</span>
        </li>
      </ul>
      <template #pied>
        <div class="flex flex-wrap gap-2 justify-end">
          <AppButton variante="outline" @click="reinitialiser">Déposer d'autres candidatures</AppButton>
          <AppButton @click="$router.push({ name: 'candidats' })">Voir la liste des candidats</AppButton>
        </div>
      </template>
    </AppCard>

    <!-- ===================== Formulaire (assistant en 4 étapes) ===================== -->
    <form v-else class="space-y-4" @submit.prevent="enregistrer">
      <AppAlert v-if="erreur" type="erreur" :message="erreur" :erreurs="erreursNonAffichees" />

      <AppCard sans-marge>
        <div class="px-5 pt-5">
          <AppSteps :etapes="titresEtapes" :actuelle="etape" />
        </div>

        <div class="p-5 space-y-4">
          <!-- ===================== 1. Examen et type ===================== -->
          <div v-show="etape === 1">
            <div class="grid sm:grid-cols-2 gap-4">
              <AppSelect v-model="form.examen" label="Examen" :options="optionsExamenAutorises" obligatoire :erreur="erreurs.examen" @update:model-value="changerExamen" />
              <AppSelect v-model="form.type_candidat" label="Type de candidat" :options="optionsTypeAutorises" obligatoire :erreur="erreurs.type_candidat" @update:model-value="changerType" />
            </div>
            <p v-if="form.examen" class="mt-3 text-xs text-slate-500">
              <template v-if="estRegulier">Candidat régulier : élève inscrit sur l'année active en {{ niveauAttendu }} dans l'établissement choisi.</template>
              <template v-else>Candidat libre : dépôt {{ form.examen === 'DEF' ? 'auprès d’un CAP' : 'auprès d’une académie' }} ; l'élève peut être créé s'il n'a pas de matricule.</template>
            </p>
          </div>

          <template v-if="form.examen && form.type_candidat">
            <!-- ===================== 2. Lieu ===================== -->
            <div v-show="etape === 2">
              <EtablissementPicker v-if="estRegulier" v-model="form.etablissement_id" :ordre="ordreExamen" obligatoire :erreur="erreurs.etablissement_id" />

              <template v-else>
                <div class="grid sm:grid-cols-2 gap-4">
                  <AppSelect v-if="estNational" v-model="academieChoisie" label="Académie" :options="academies" cle-valeur="id" cle-libelle="nom" numerique
                             :obligatoire="form.examen !== 'DEF'" :chargement="chargementListes" :erreur="erreurs.academie_id" @update:model-value="changerAcademie" />
                  <AppSelect v-if="form.examen === 'DEF' && niveauPerimetre !== 'cap'" v-model="form.cap_id" label="CAP de dépôt" :options="caps" cle-valeur="id" cle-libelle="nom" numerique obligatoire
                             :chargement="chargementListes" :erreur="erreurs.cap_id" />
                  <p v-else-if="form.examen === 'DEF'" class="text-sm text-slate-600 self-end">CAP de dépôt : <span class="font-medium">{{ perimetre.cap?.nom }}</span> (votre périmètre)</p>
                  <p v-if="form.examen !== 'DEF' && !estNational" class="text-sm text-slate-600 self-end">Académie de dépôt : <span class="font-medium">{{ perimetre.academie?.nom }}</span> (votre périmètre)</p>
                </div>
              </template>
            </div>

            <!-- ===================== 3. Élève(s) ===================== -->
            <div v-show="etape === 3">
              <div v-if="!estRegulier" class="flex gap-4 mb-4 text-sm">
                <label class="inline-flex items-center gap-2"><input v-model="modeEleve" type="radio" value="matricule" /> Élève déjà immatriculé</label>
                <label class="inline-flex items-center gap-2"><input v-model="modeEleve" type="radio" value="nouveau" /> Nouvel élève (sans matricule)</label>
              </div>

              <!-- Bascule un seul / plusieurs candidats : seulement quand l'élève est désigné par matricule -->
              <div v-if="estRegulier || modeEleve === 'matricule'" class="inline-flex rounded-lg border border-slate-300 p-0.5 mb-4 text-sm">
                <button type="button" class="px-3 py-1.5 rounded-md transition-colors" :class="modeCandidats === 'un' ? 'bg-cnece-primary text-white' : 'text-slate-600 hover:bg-slate-100'" @click="modeCandidats = 'un'">
                  Un seul candidat
                </button>
                <button type="button" class="px-3 py-1.5 rounded-md transition-colors" :class="modeCandidats === 'plusieurs' ? 'bg-cnece-primary text-white' : 'text-slate-600 hover:bg-slate-100'" @click="modeCandidats = 'plusieurs'">
                  Plusieurs candidats
                </button>
              </div>

              <template v-if="modeCandidats === 'un' || (!estRegulier && modeEleve === 'nouveau')">
                <EleveSearchField v-if="estRegulier || modeEleve === 'matricule'" v-model="eleve" obligatoire :erreur="erreurs.eleve_id || erreurs.matricule" />
                <EtatCivilFields v-else v-model="etatCivil" :erreurs="erreursEleve" />

                <!-- Série / filière -->
                <div v-if="form.examen !== 'DEF'" class="grid sm:grid-cols-2 gap-4 mt-4">
                  <AppSelect v-if="form.examen === 'BAC'" v-model="form.serie_id" label="Série" :options="optionsSeries" numerique obligatoire
                             :aide="estRegulier ? 'Doit correspondre à la série d’inscription en 12ème' : ''" :erreur="erreurs.serie_id" />
                  <AppSelect v-else v-model="form.filiere_id" label="Filière" :options="optionsFilieres(form.examen)" numerique obligatoire
                             :aide="`Filières dont le diplôme est ${form.examen}`" :erreur="erreurs.filiere_id" />
                </div>
              </template>

              <!-- ===================== Dépôt groupé ===================== -->
              <template v-else>
                <div class="flex gap-2 items-end">
                  <EleveSearchField v-model="eleveTemp" label="Rechercher un candidat" aide="Cherchez un élève par matricule puis ajoutez-le à la liste ci-dessous." class="flex-1" />
                  <AppButton v-if="eleveTemp" variante="outline" class="shrink-0" @click="ajouterCandidat">+ Ajouter à la liste</AppButton>
                </div>
                <p v-if="erreurAjout" class="mt-1 text-xs text-cnece-danger">{{ erreurAjout }}</p>

                <div v-if="candidatsListe.length" class="mt-4 space-y-2">
                  <p class="text-sm font-medium text-slate-700">{{ candidatsListe.length }} candidat(s) dans la liste</p>
                  <div v-for="(c, index) in candidatsListe" :key="c.eleve.id" class="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                    <div class="text-sm min-w-0 flex-1">
                      <p class="font-medium text-slate-800 truncate">{{ c.eleve.prenom }} {{ c.eleve.nom }}</p>
                      <MatriculeBadge :matricule="c.eleve.matricule" />
                    </div>
                    <select v-if="form.examen === 'BAC'" v-model.number="c.serie_id" aria-label="Série" class="champ-filtre w-40 shrink-0">
                      <option value="">— Série —</option>
                      <option v-for="o in optionsSeries" :key="o.valeur" :value="o.valeur">{{ o.libelle }}</option>
                    </select>
                    <select v-else-if="['CAP', 'BT'].includes(form.examen)" v-model.number="c.filiere_id" aria-label="Filière" class="champ-filtre w-48 shrink-0">
                      <option value="">— Filière —</option>
                      <option v-for="o in optionsFilieres(form.examen)" :key="o.valeur" :value="o.valeur">{{ o.libelle }}</option>
                    </select>
                    <AppIconButton action="supprimer" titre="Retirer de la liste" @click="candidatsListe.splice(index, 1)" />
                  </div>
                </div>
                <p v-else class="mt-3 text-sm text-slate-500">Aucun candidat ajouté pour l'instant.</p>
              </template>
            </div>

            <!-- ===================== 4. Pièces ===================== -->
            <div v-show="etape === 4">
              <p class="text-sm text-slate-500 mb-4">Facultatif — liste des pièces fournies</p>
              <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                <label v-for="p in PIECES" :key="p.valeur" class="inline-flex items-center gap-2">
                  <input v-model="form.pieces_jointes" type="checkbox" :value="p.valeur" class="rounded border-slate-300" /> {{ p.libelle }}
                </label>
              </div>
              <div class="flex gap-2 mt-3 max-w-md">
                <AppInput v-model="autrePiece" label="Autre pièce" placeholder="ex. certificat_medical" class="flex-1" />
                <AppButton variante="outline" class="self-end" :disabled="!autrePiece" @click="ajouterPiece">Ajouter</AppButton>
              </div>
              <div v-if="piecesLibres.length" class="mt-2 flex flex-wrap gap-1">
                <AppBadge v-for="p in piecesLibres" :key="p" :valeur="p" couleur="gris" />
              </div>
            </div>
          </template>
        </div>
      </AppCard>

      <div class="flex justify-between gap-2">
        <AppButton variante="danger" :disabled="chargement" @click="$router.back()">Annuler</AppButton>
        <div class="flex gap-2">
          <AppButton v-if="etape > 1" variante="outline" :disabled="chargement" @click="etape--">Précédent</AppButton>
          <AppButton v-if="etape < 4" :disabled="etape === 1 && !(form.examen && form.type_candidat)" @click="etape++">Suivant</AppButton>
          <AppButton v-else type="submit" :chargement="chargement" :disabled="!pretASoumettre">
            {{ modeCandidats === 'plusieurs' ? `Déposer ${candidatsListe.length} candidature(s)` : 'Déposer la candidature' }}
          </AppButton>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import candidatsService from '@/services/candidats.service.js'
import academiesService from '@/services/academies.service.js'
import capsService from '@/services/caps.service.js'
import { useAuthStore } from '@/stores/auth.js'
import { useReferentielsStore } from '@/stores/referentiels.js'
import { ROLES } from '@/utils/permissions.js'
import { optionsDepuis } from '@/utils/format.js'
import { ETAT_CIVIL_VIDE } from '@/components/forms/EtatCivilFields.vue'

const PIECES = [
  { valeur: 'extrait_naissance', libelle: 'Extrait de naissance' },
  { valeur: 'photo_identite', libelle: "Photo d'identité" },
  { valeur: 'recu_frais_inscription', libelle: "Reçu des frais d'inscription" },
  { valeur: 'certificat_scolarite', libelle: 'Certificat de scolarité' },
  { valeur: 'releve_notes', libelle: 'Relevé de notes' },
]
const ORDRE_PAR_EXAMEN = { DEF: 'fondamental', BAC: 'lycee', CAP: 'technique_professionnel', BT: 'technique_professionnel' }
const NIVEAU_PAR_EXAMEN = { DEF: '9ème', BAC: '12ème', CAP: 'dernière année (2ème) de filière CAP', BT: 'dernière année (4ème) de filière BT' }
const FORM_VIDE = () => ({ examen: '', type_candidat: '', etablissement_id: '', cap_id: '', academie_id: '', serie_id: '', filiere_id: '', pieces_jointes: [] })

export default {
  name: 'CandidatureView',

  data() {
    return {
      PIECES,
      etape: 1,
      form: FORM_VIDE(),
      eleve: null,               // élève trouvé par matricule
      modeEleve: 'matricule',    // libre : 'matricule' | 'nouveau'
      etatCivil: ETAT_CIVIL_VIDE(),
      modeCandidats: 'un',       // 'un' | 'plusieurs' (dépôt groupé, uniquement par matricule)
      eleveTemp: null,           // champ de recherche du dépôt groupé
      erreurAjout: '',
      candidatsListe: [],        // dépôt groupé : [{ eleve, serie_id, filiere_id }]
      academieChoisie: '',
      academies: [],
      caps: [],
      chargementListes: false,
      autrePiece: '',
      chargement: false,
      erreur: '',
      erreurs: {},
      resultat: null,
      resultatsMultiples: null,
    }
  },

  computed: {
    ...mapState(useAuthStore, ['role', 'perimetre', 'niveauPerimetre']),
    ...mapState(useReferentielsStore, ['optionsSeries', 'optionsFilieres']),
    estNational() {
      return this.niveauPerimetre === 'national'
    },
    titresEtapes() {
      return ['Examen et type', this.estRegulier ? 'Établissement' : 'Lieu de dépôt', 'Candidat', 'Pièces']
    },
    estRegulier() {
      return this.form.type_candidat === 'regulier'
    },
    ordreExamen() {
      return ORDRE_PAR_EXAMEN[this.form.examen] || ''
    },
    niveauAttendu() {
      return NIVEAU_PAR_EXAMEN[this.form.examen] || ''
    },
    /** Examens selon le rôle : agent CAP → DEF ; admin académie → BAC/CAP/BT ; directeur → selon l'ordre de son établissement. */
    optionsExamenAutorises() {
      const tous = optionsDepuis('examen')
      if (this.role === ROLES.AGENT_CAP) return tous.filter((o) => o.valeur === 'DEF')
      if (this.role === ROLES.ADMIN_ACADEMIE) return tous.filter((o) => o.valeur !== 'DEF')
      if (this.role === ROLES.DIRECTEUR) {
        const ordre = this.perimetre?.etablissement?.ordre
        return tous.filter((o) => ORDRE_PAR_EXAMEN[o.valeur] === ordre)
      }
      return tous
    },
    /** Le directeur ne dépose que des candidatures régulières. */
    optionsTypeAutorises() {
      const tous = optionsDepuis('type_candidat')
      return this.role === ROLES.DIRECTEUR ? tous.filter((o) => o.valeur === 'regulier') : tous
    },
    /** Erreurs 422 de l'objet `eleve.*` (création libre) remises à plat pour EtatCivilFields. */
    erreursEleve() {
      return Object.fromEntries(
        Object.entries(this.erreurs).filter(([c]) => c.startsWith('eleve.')).map(([c, m]) => [c.replace('eleve.', ''), m])
      )
    },
    erreursNonAffichees() {
      const affiches = new Set(['examen', 'type_candidat', 'etablissement_id', 'cap_id', 'academie_id', 'serie_id', 'filiere_id', 'eleve_id', 'matricule'])
      const reste = Object.fromEntries(Object.entries(this.erreurs).filter(([c]) => !affiches.has(c) && !c.startsWith('eleve.')))
      return Object.keys(reste).length ? reste : null
    },
    piecesLibres() {
      const connues = new Set(PIECES.map((p) => p.valeur))
      return this.form.pieces_jointes.filter((p) => !connues.has(p))
    },
    succesMultiples() {
      return (this.resultatsMultiples || []).filter((r) => r.ok).length
    },
    pretASoumettre() {
      const f = this.form
      if (!f.examen || !f.type_candidat) return false

      if (this.modeCandidats === 'plusieurs') {
        if (!this.candidatsListe.length) return false
        if (f.examen === 'BAC' && this.candidatsListe.some((c) => !c.serie_id)) return false
        if (['CAP', 'BT'].includes(f.examen) && this.candidatsListe.some((c) => !c.filiere_id)) return false
        return this.estRegulier ? Boolean(f.etablissement_id) : Boolean(f.examen === 'DEF' ? this.capIdEffectif : this.academieIdEffective)
      }

      if (f.examen === 'BAC' && !f.serie_id) return false
      if (['CAP', 'BT'].includes(f.examen) && !f.filiere_id) return false
      if (this.estRegulier) return Boolean(f.etablissement_id && this.eleve)
      // libre
      const lieuOk = f.examen === 'DEF' ? Boolean(this.capIdEffectif) : Boolean(this.academieIdEffective)
      const eleveOk = this.modeEleve === 'matricule' ? Boolean(this.eleve) : Boolean(this.etatCivil.prenom && this.etatCivil.nom && this.etatCivil.sexe && this.etatCivil.date_naissance && this.etatCivil.lieu_naissance)
      return lieuOk && eleveOk
    },
    capIdEffectif() {
      return this.niveauPerimetre === 'cap' ? this.perimetre.cap.id : this.form.cap_id
    },
    academieIdEffective() {
      return this.estNational ? this.academieChoisie : this.perimetre?.academie?.id
    },
  },

  watch: {
    // Régulier au BAC/CAP/BT : on propose la série / filière de l'inscription en cours de l'élève
    eleve(e) {
      const insc = e?.inscription_active
      if (!insc || !this.estRegulier) return
      if (this.form.examen === 'BAC' && insc.serie_id) this.form.serie_id = insc.serie_id
      if (['CAP', 'BT'].includes(this.form.examen) && insc.filiere_id) this.form.filiere_id = insc.filiere_id
    },
  },

  async created() {
    this.chargerTout()
    // Valeurs imposées par le rôle
    if (this.optionsExamenAutorises.length === 1) this.form.examen = this.optionsExamenAutorises[0].valeur
    if (this.optionsTypeAutorises.length === 1) this.form.type_candidat = this.optionsTypeAutorises[0].valeur
    this.chargementListes = true
    try {
      if (this.estNational) this.academies = await academiesService.listerPourSelect()
      if (this.niveauPerimetre === 'academie') this.caps = await capsService.listerPourSelect(this.perimetre.academie.id)
    } finally {
      this.chargementListes = false
    }
  },

  methods: {
    ...mapActions(useReferentielsStore, ['chargerTout']),

    changerExamen() {
      this.form.serie_id = ''
      this.form.filiere_id = ''
      this.form.etablissement_id = ''
      this.eleve = null
      this.candidatsListe = []
    },
    changerType() {
      this.form.etablissement_id = ''
      this.eleve = null
      this.modeEleve = 'matricule'
      this.modeCandidats = 'un'
      this.candidatsListe = []
    },
    /** Dépôt groupé : ajoute l'élève trouvé à la liste (pré-remplit sa série/filière depuis son inscription active). */
    ajouterCandidat() {
      if (!this.eleveTemp) return
      if (this.candidatsListe.some((c) => c.eleve.id === this.eleveTemp.id)) {
        this.erreurAjout = 'Ce candidat est déjà dans la liste.'
        return
      }
      const insc = this.eleveTemp.inscription_active
      this.candidatsListe.push({
        eleve: this.eleveTemp,
        serie_id: (this.estRegulier && insc?.serie_id) || '',
        filiere_id: (this.estRegulier && insc?.filiere_id) || '',
      })
      this.erreurAjout = ''
      this.eleveTemp = null
    },
    async changerAcademie() {
      this.form.cap_id = ''
      this.caps = this.academieChoisie ? await capsService.listerPourSelect(this.academieChoisie).catch(() => []) : []
    },
    ajouterPiece() {
      const code = this.autrePiece.trim().toLowerCase().replace(/\s+/g, '_')
      if (code && !this.form.pieces_jointes.includes(code)) this.form.pieces_jointes.push(code)
      this.autrePiece = ''
    },

    /** Construit le body CandidatEntree selon RG-5. */
    construireCorps() {
      const f = this.form
      const corps = { examen: f.examen, type_candidat: f.type_candidat }
      if (f.pieces_jointes.length) corps.pieces_jointes = f.pieces_jointes
      if (f.examen === 'BAC') corps.serie_id = f.serie_id
      if (['CAP', 'BT'].includes(f.examen)) corps.filiere_id = f.filiere_id

      if (this.estRegulier) {
        corps.etablissement_id = f.etablissement_id
        corps.eleve_id = this.eleve.id
      } else {
        if (f.examen === 'DEF') corps.cap_id = this.capIdEffectif
        else corps.academie_id = this.academieIdEffective
        if (this.modeEleve === 'matricule') corps.eleve_id = this.eleve.id
        else corps.eleve = Object.fromEntries(Object.entries(this.etatCivil).filter(([, v]) => v !== ''))
      }
      return corps
    },

    /** Même corps que construireCorps(), mais pour un candidat de la liste (dépôt groupé). */
    construireCorpsCandidat(candidat) {
      const f = this.form
      const corps = { examen: f.examen, type_candidat: f.type_candidat, eleve_id: candidat.eleve.id }
      if (f.pieces_jointes.length) corps.pieces_jointes = f.pieces_jointes
      if (f.examen === 'BAC') corps.serie_id = candidat.serie_id
      if (['CAP', 'BT'].includes(f.examen)) corps.filiere_id = candidat.filiere_id

      if (this.estRegulier) corps.etablissement_id = f.etablissement_id
      else if (f.examen === 'DEF') corps.cap_id = this.capIdEffectif
      else corps.academie_id = this.academieIdEffective
      return corps
    },

    async enregistrer() {
      if (this.modeCandidats === 'plusieurs') return this.enregistrerPlusieurs()
      this.chargement = true
      this.erreur = ''
      this.erreurs = {}
      try {
        this.resultat = await candidatsService.deposer(this.construireCorps())
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (e) {
        this.erreur = e.message // 409 : déjà candidat ; 422 : inscription incohérente ; 403 : hors périmètre
        this.erreurs = e.erreurs || {}
        this.allerEtapeErreur()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } finally {
        this.chargement = false
      }
    },

    /** Dépôt groupé : une requête par candidat, on continue même si l'un échoue (déjà candidat, etc.). */
    async enregistrerPlusieurs() {
      this.chargement = true
      const resultats = []
      for (const candidat of this.candidatsListe) {
        try {
          const candidature = await candidatsService.deposer(this.construireCorpsCandidat(candidat))
          resultats.push({ eleve: candidat.eleve, ok: true, candidature })
        } catch (e) {
          resultats.push({ eleve: candidat.eleve, ok: false, message: e.message })
        }
      }
      this.resultatsMultiples = resultats
      this.chargement = false
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },

    /** Ramène l'utilisateur sur la première étape où le serveur a signalé une erreur de champ. */
    allerEtapeErreur() {
      const champs = Object.keys(this.erreurs)
      if (!champs.length) return
      if (champs.some((c) => ['examen', 'type_candidat'].includes(c))) return void (this.etape = 1)
      if (champs.some((c) => ['etablissement_id', 'cap_id', 'academie_id'].includes(c))) return void (this.etape = 2)
      if (champs.some((c) => ['eleve_id', 'matricule', 'serie_id', 'filiere_id'].includes(c) || c.startsWith('eleve.'))) this.etape = 3
    },

    reinitialiser() {
      const { examen, type_candidat } = this.form
      this.form = { ...FORM_VIDE(), examen, type_candidat }
      this.eleve = null
      this.etatCivil = ETAT_CIVIL_VIDE()
      this.modeCandidats = 'un'
      this.eleveTemp = null
      this.erreurAjout = ''
      this.candidatsListe = []
      this.etape = 1
      this.resultat = null
      this.resultatsMultiples = null
      this.erreur = ''
      this.erreurs = {}
    },
  },
}
</script>
