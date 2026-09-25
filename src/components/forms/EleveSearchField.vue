<!-- src/components/forms/EleveSearchField.vue
     Champ « trouver un élève par matricule » : appelle GET /eleves/recherche puis émet
     l'élève trouvé (`update:modelValue`) avec sa fiche (inscription active, historique).
     Utilisé pour désigner l'élève d'un transfert ou d'une candidature. -->
<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-slate-700 mb-1">
      {{ label }} <span v-if="obligatoire" class="text-cnece-danger" aria-hidden="true">*</span>
    </label>

    <!-- Élève sélectionné -->
    <div v-if="modelValue" class="flex items-center justify-between gap-3 rounded-lg border border-cnece-accent bg-cnece-secondary/40 px-3 py-2">
      <div class="text-sm min-w-0">
        <p class="font-semibold text-slate-800 truncate">{{ modelValue.prenom }} {{ modelValue.nom }}</p>
        <p class="text-xs text-slate-600">
          <MatriculeBadge :matricule="modelValue.matricule" />
          <span class="ml-2">{{ libelle('sexe', modelValue.sexe) }} · né(e) le {{ formaterDate(modelValue.date_naissance) }}</span>
        </p>
        <p v-if="inscription" class="text-xs text-slate-600 mt-0.5">
          Inscrit : {{ inscription.etablissement?.nom }} · {{ libelleNiveau(inscription.niveau) }}
          <span v-if="inscription.serie"> · {{ inscription.serie.code }}</span>
          <span v-if="inscription.filiere"> · {{ inscription.filiere.code }}</span>
        </p>
        <p v-else class="text-xs text-cnece-gold mt-0.5">Aucune inscription sur l'année active.</p>
      </div>
      <AppButton v-if="!disabled" variante="outline" taille="sm" @click="effacer">Changer</AppButton>
    </div>

    <!-- Saisie -->
    <div v-else class="flex gap-2">
      <input
        :id="id"
        v-model.trim="matricule"
        type="search"
        maxlength="10"
        placeholder="Matricule (10 caractères)"
        class="flex-1 font-mono uppercase tracking-wider rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cnece-accent"
        :class="messageErreur ? 'border-cnece-danger' : 'border-slate-300'"
        :disabled="disabled"
        @input="matricule = matricule.toUpperCase()"
        @keydown.enter.prevent="rechercher"
      />
      <AppButton variante="outline" :chargement="chargement" :disabled="disabled || matricule.length !== 10" @click="rechercher">Rechercher</AppButton>
    </div>
    <p v-if="messageErreur" class="mt-1 text-xs text-cnece-danger">{{ messageErreur }}</p>
    <p v-else-if="aide && !modelValue" class="mt-1 text-xs text-slate-500">{{ aide }}</p>
  </div>
</template>

<script>
import AppButton from '../common/AppButton.vue'
import MatriculeBadge from '../common/MatriculeBadge.vue'
import elevesService from '@/services/eleves.service.js'
import { formaterDate, libelle, libelleNiveau } from '@/utils/format.js'

let compteur = 0

export default {
  name: 'EleveSearchField',
  components: { AppButton, MatriculeBadge },
  props: {
    modelValue: { type: Object, default: null }, // élève complet ou null
    label: { type: String, default: 'Élève' },
    aide: { type: String, default: 'Recherche nationale : fonctionne même hors de votre périmètre.' },
    obligatoire: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    erreur: { type: [String, Array], default: '' },
  },
  emits: ['update:modelValue'],
  data() {
    return { id: `eleve-${++compteur}`, matricule: '', chargement: false, erreurRecherche: '' }
  },
  computed: {
    inscription() {
      return this.modelValue?.inscription_active || this.modelValue?.inscriptions?.find((i) => i.annee_scolaire?.active) || null
    },
    messageErreur() {
      if (this.erreurRecherche) return this.erreurRecherche
      return Array.isArray(this.erreur) ? this.erreur[0] || '' : this.erreur
    },
  },
  methods: {
    formaterDate,
    libelle,
    libelleNiveau,
    async rechercher() {
      if (this.matricule.length !== 10) return
      this.chargement = true
      this.erreurRecherche = ''
      try {
        const eleve = await elevesService.rechercherParMatricule(this.matricule)
        this.$emit('update:modelValue', eleve)
      } catch (e) {
        this.erreurRecherche = e.statut === 404 ? `Aucun élève ne porte le matricule ${this.matricule}.` : e.message
      } finally {
        this.chargement = false
      }
    },
    effacer() {
      this.matricule = ''
      this.erreurRecherche = ''
      this.$emit('update:modelValue', null)
    },
  },
}
</script>
