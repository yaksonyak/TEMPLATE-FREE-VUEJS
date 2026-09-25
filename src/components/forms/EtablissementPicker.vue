<!-- src/components/forms/EtablissementPicker.vue
     Sélecteur d'établissement « en cascade », adapté au périmètre de l'utilisateur :
       - national      : Académie → CAP (si fondamental) → Établissement
       - academie      : CAP (facultatif) → Établissement
       - cap           : Établissement (écoles du CAP)
       - etablissement : imposé, non modifiable
     v-model = identifiant. Émet aussi `selection` avec l'objet établissement COMPLET
     (GET /etablissements/{id} : ordre, cycles, series, filieres) pour piloter les champs d'inscription. -->
<template>
  <div class="grid gap-3" :class="colonnes">
    <AppSelect v-if="afficherAcademie" v-model="academieId" label="Académie" :options="academies" cle-valeur="id" cle-libelle="nom"
               numerique :chargement="chargement.academies" :disabled="disabled" @update:model-value="changerAcademie" />
    <AppSelect v-if="afficherCap" v-model="capId" :label="ordre ? 'CAP' : 'CAP (écoles fondamentales)'" :options="caps" cle-valeur="id" cle-libelle="nom"
               numerique :chargement="chargement.caps" :disabled="disabled" :placeholder="ordre === 'fondamental' ? '— Sélectionner —' : 'Tous / lycées et techniques'" @update:model-value="changerCap" />
    <AppSelect :model-value="modelValue" :label="label" :options="etablissements" cle-valeur="id" cle-libelle="nom" numerique
               :obligatoire="obligatoire" :erreur="erreur" :chargement="chargement.etablissements"
               :disabled="disabled || niveauPerimetre === 'etablissement'" :aide="aide" @update:model-value="changerEtablissement" />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import AppSelect from './AppSelect.vue'
import { useAuthStore } from '@/stores/auth.js'
import academiesService from '@/services/academies.service.js'
import capsService from '@/services/caps.service.js'
import etablissementsService from '@/services/etablissements.service.js'

export default {
  name: 'EtablissementPicker',
  components: { AppSelect },
  props: {
    modelValue: { type: [Number, String], default: '' },
    label: { type: String, default: 'Établissement' },
    /** Restreint à un ordre d'enseignement : 'fondamental' | 'lycee' | 'technique_professionnel' */
    ordre: { type: String, default: '' },
    obligatoire: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    erreur: { type: [String, Array], default: '' },
    /** 'ligne' : selects côte à côte ; 'colonne' : empilés */
    disposition: { type: String, default: 'ligne' },
  },
  emits: ['update:modelValue', 'selection'],

  data() {
    return {
      academieId: '',
      capId: '',
      academies: [],
      caps: [],
      etablissements: [],
      chargement: { academies: false, caps: false, etablissements: false },
    }
  },

  computed: {
    ...mapState(useAuthStore, ['perimetre', 'niveauPerimetre']),
    afficherAcademie() {
      return this.niveauPerimetre === 'national'
    },
    afficherCap() {
      // Pas de CAP pour les lycées / techniques, ni quand le périmètre est déjà un CAP ou un établissement
      if (this.ordre && this.ordre !== 'fondamental') return false
      return ['national', 'academie'].includes(this.niveauPerimetre)
    },
    colonnes() {
      if (this.disposition === 'colonne') return 'grid-cols-1'
      const n = 1 + (this.afficherAcademie ? 1 : 0) + (this.afficherCap ? 1 : 0)
      return { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3' }[n]
    },
    aide() {
      return this.niveauPerimetre === 'etablissement' ? 'Votre établissement (périmètre)' : ''
    },
  },

  async created() {
    // Périmètre établissement : une seule option, sélectionnée d'office.
    if (this.niveauPerimetre === 'etablissement') {
      this.etablissements = [this.perimetre.etablissement]
      if (!this.modelValue) this.changerEtablissement(this.perimetre.etablissement.id)
      else this.emettreSelection(this.modelValue)
      return
    }
    if (this.afficherAcademie) this.chargerAcademies()
    // Valeur initiale (modification, réinscription) : on remonte la cascade depuis l'établissement.
    if (this.modelValue) {
      const etab = await this.emettreSelection(this.modelValue)
      if (etab) {
        this.academieId = etab.academie_id || ''
        this.capId = etab.cap_id || ''
      }
    } else if (this.niveauPerimetre === 'academie') {
      this.academieId = this.perimetre.academie.id
    } else if (this.niveauPerimetre === 'cap') {
      this.capId = this.perimetre.cap.id
    }
    if (this.afficherCap && this.academieId) this.chargerCaps()
    this.chargerEtablissements()
  },

  methods: {
    async chargerAcademies() {
      this.chargement.academies = true
      this.academies = await academiesService.listerPourSelect().catch(() => [])
      this.chargement.academies = false
    },
    async chargerCaps() {
      this.chargement.caps = true
      this.caps = await capsService.listerPourSelect(this.academieId || null).catch(() => [])
      this.chargement.caps = false
    },
    async chargerEtablissements() {
      this.chargement.etablissements = true
      const filtres = { ordre_enseignement: this.ordre || undefined }
      if (this.capId) filtres.cap_id = this.capId
      else if (this.academieId) filtres.academie_id = this.academieId
      this.etablissements = await etablissementsService.listerPourSelect(filtres).catch(() => [])
      this.chargement.etablissements = false
    },

    changerAcademie() {
      this.capId = ''
      this.changerEtablissement('')
      if (this.afficherCap) this.chargerCaps()
      this.chargerEtablissements()
    },
    changerCap() {
      this.changerEtablissement('')
      this.chargerEtablissements()
    },
    changerEtablissement(id) {
      this.$emit('update:modelValue', id)
      this.emettreSelection(id)
    },
    /** Charge le détail (series, filieres, cycles…) et l'émet au parent. */
    async emettreSelection(id) {
      if (!id) {
        this.$emit('selection', null)
        return null
      }
      try {
        const etab = await etablissementsService.detail(id)
        this.$emit('selection', etab)
        return etab
      } catch {
        this.$emit('selection', null)
        return null
      }
    },
  },
}
</script>
