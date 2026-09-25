<!-- src/views/eleves/EleveCreateView.vue
     Objectif : inscrire un NOUVEL élève. L'API crée l'élève, génère son matricule national
     (AAEECCNNNL) et enregistre sa première inscription sur l'année active, en une transaction (RG-2/3/4).
     Endpoints : POST /eleves ; GET /etablissements, /series, /filieres (via les composants de formulaire).
     Permissions : rôles de gestion, établissement dans le périmètre (canEdit('eleves')).
     Après succès : affichage du matricule + des `avertissements` non bloquants (âge, homonyme). -->
<template>
  <div class="max-w-5xl mx-auto space-y-4">
    <!-- ===================== Écran de succès ===================== -->
    <AppCard v-if="resultat" titre="Élève inscrit avec succès" sous-titre="Le matricule national est définitif et immuable">
      <div class="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <div class="text-3xl">
          <MatriculeBadge :matricule="resultat.matricule" />
        </div>
        <div class="text-sm">
          <p class="font-semibold text-slate-800">{{ resultat.prenom }} {{ resultat.nom }}</p>
          <p class="text-slate-500">
            {{ resultat.inscription_active?.etablissement?.nom || etablissementChoisi?.nom }} ·
            {{ libelleNiveau(resultat.inscription_active?.niveau || inscription.niveau) }}
          </p>
        </div>
      </div>

      <AppAlert v-if="resultat.avertissements?.length" type="avertissement" message="Points d'attention signalés par le serveur (non bloquants) :" class="mb-4">
      </AppAlert>
      <ul v-if="resultat.avertissements?.length" class="list-disc list-inside text-sm text-cnece-gold mb-4 -mt-2 pl-4">
        <li v-for="(a, i) in resultat.avertissements" :key="i">{{ a }}</li>
      </ul>

      <template #pied>
        <div class="flex flex-wrap gap-2 justify-end">
          <AppButton variante="outline" @click="nouvelle">Inscrire un autre élève</AppButton>
          <AppButton @click="$router.push({ name: 'eleve-detail', params: { id: resultat.id } })">Ouvrir la fiche</AppButton>
        </div>
      </template>
    </AppCard>

    <!-- ===================== Formulaire (assistant en 2 étapes) ===================== -->
    <form v-else class="space-y-4" @submit.prevent="enregistrer">
      <AppAlert v-if="erreur" type="erreur" :message="erreur" :erreurs="erreursNonAffichees" />

      <AppCard sans-marge>
        <div class="px-5 pt-5">
          <AppSteps :etapes="['État civil', 'Inscription']" :actuelle="etape" />
        </div>

        <div class="p-5">
          <div v-show="etape === 1">
            <p class="text-sm text-slate-500 mb-4">Les champs marqués * sont obligatoires</p>
            <EtatCivilFields v-model="etatCivil" :erreurs="erreurs" />
          </div>

          <div v-show="etape === 2">
            <p class="text-sm text-slate-500 mb-4">{{ anneeActive ? `Année scolaire active : ${anneeActive.libelle}` : 'Chargement de l’année active…' }}</p>
            <InscriptionFields v-model="inscription" :erreurs="erreurs" @etablissement="etablissementChoisi = $event" />
          </div>
        </div>
      </AppCard>

      <div class="flex justify-between gap-2">
        <AppButton variante="danger" :disabled="chargement" @click="$router.back()">Annuler</AppButton>
        <div class="flex gap-2">
          <AppButton v-if="etape > 1" variante="outline" :disabled="chargement" @click="etape--">Précédent</AppButton>
          <AppButton v-if="etape < 2" @click="etape++">Suivant</AppButton>
          <AppButton v-else type="submit" :chargement="chargement">Enregistrer et générer le matricule</AppButton>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import elevesService from '@/services/eleves.service.js'
import { useReferentielsStore } from '@/stores/referentiels.js'
import { ETAT_CIVIL_VIDE } from '@/components/forms/EtatCivilFields.vue'
import { INSCRIPTION_VIDE } from '@/components/forms/InscriptionFields.vue'
import { libelleNiveau } from '@/utils/format.js'

const CHAMPS_ETAT_CIVIL = new Set(Object.keys(ETAT_CIVIL_VIDE()))

// Champs déjà affichés sous un input : on ne les répète pas dans l'alerte globale
const CHAMPS_AFFICHES = new Set([
  ...CHAMPS_ETAT_CIVIL,
  ...Object.keys(INSCRIPTION_VIDE()),
])

export default {
  name: 'EleveCreateView',

  data() {
    return {
      etape: 1,
      etatCivil: ETAT_CIVIL_VIDE(),
      inscription: INSCRIPTION_VIDE(),
      etablissementChoisi: null,
      chargement: false,
      erreur: '',
      erreurs: {},
      resultat: null, // élève créé (avec matricule et avertissements)
    }
  },

  computed: {
    ...mapState(useReferentielsStore, ['anneeActive']),
    /** Erreurs 422 sur des champs qui n'ont pas d'input dédié (ex. règle métier globale). */
    erreursNonAffichees() {
      const reste = Object.fromEntries(Object.entries(this.erreurs).filter(([champ]) => !CHAMPS_AFFICHES.has(champ)))
      return Object.keys(reste).length ? reste : null
    },
  },

  created() {
    this.chargerTout() // séries, filières, année active (cache Pinia)
  },

  methods: {
    ...mapActions(useReferentielsStore, ['chargerTout']),
    libelleNiveau,

    /** Fusionne état civil + inscription, sans les champs vides. */
    construireCorps() {
      const corps = { ...this.etatCivil, ...this.inscription }
      return Object.fromEntries(Object.entries(corps).filter(([, v]) => v !== '' && v !== null))
    },

    async enregistrer() {
      this.chargement = true
      this.erreur = ''
      this.erreurs = {}
      try {
        this.resultat = await elevesService.creer(this.construireCorps())
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (e) {
        // 422 : erreurs par champ ; 403 : établissement hors périmètre ; 409 : aucune année active
        this.erreur = e.message
        this.erreurs = e.erreurs || {}
        // Si l'erreur porte sur un champ de l'étape 1, on y ramène l'utilisateur
        if (Object.keys(this.erreurs).some((champ) => CHAMPS_ETAT_CIVIL.has(champ))) this.etape = 1
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } finally {
        this.chargement = false
      }
    },

    nouvelle() {
      this.etape = 1
      this.etatCivil = ETAT_CIVIL_VIDE()
      // On garde l'établissement : on enchaîne souvent plusieurs inscriptions au même endroit
      this.inscription = { ...INSCRIPTION_VIDE(), etablissement_id: this.inscription.etablissement_id }
      this.resultat = null
      this.erreur = ''
      this.erreurs = {}
    },
  },
}
</script>
