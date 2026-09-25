<!-- src/components/forms/InscriptionFields.vue
     Champs d'une inscription (première inscription ou réinscription) :
     établissement (cascade), niveau, série ou filière, date.
     Les options de niveau / série / filière dépendent de l'établissement choisi :
       - fondamental : niveaux 1-9 selon les cycles offerts (premier 1-6, second 7-9)
       - lycee       : niveaux 10-12, série obligatoire en 11e et 12e parmi celles du lycée
       - technique   : filière obligatoire parmi celles du centre, niveaux 1 → durée de la filière
     v-model = { etablissement_id, niveau, serie_id, filiere_id, date_inscription } -->
<template>
  <div class="space-y-4">
    <EtablissementPicker
      :model-value="modelValue.etablissement_id"
      :obligatoire="etablissementObligatoire"
      :erreur="erreurs.etablissement_id"
      :disabled="disabled"
      @update:model-value="changerEtablissement"
      @selection="etablissement = $event"
    />

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <AppSelect :model-value="modelValue.niveau" label="Niveau" :options="optionsNiveaux" numerique obligatoire
                 :disabled="disabled || !etablissement" :aide="aideNiveau" :erreur="erreurs.niveau" @update:model-value="champ('niveau', $event)" />

      <AppSelect v-if="estLycee" :model-value="modelValue.serie_id" label="Série" :options="optionsSeriesEtab" numerique
                 :obligatoire="serieObligatoire" :disabled="disabled" :aide="serieObligatoire ? 'Obligatoire en 11ème et 12ème' : 'Facultative en 10ème (tronc commun)'"
                 :erreur="erreurs.serie_id" @update:model-value="champ('serie_id', $event)" />

      <AppSelect v-if="estTechnique" :model-value="modelValue.filiere_id" label="Filière" :options="optionsFilieresEtab" numerique obligatoire
                 :disabled="disabled" :erreur="erreurs.filiere_id" @update:model-value="changerFiliere" />

      <AppDatePicker :model-value="modelValue.date_inscription" label="Date d'inscription" :max="aujourdhui" aide="Défaut : aujourd'hui"
                     :disabled="disabled" :erreur="erreurs.date_inscription" @update:model-value="champ('date_inscription', $event)" />
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import AppSelect from './AppSelect.vue'
import AppDatePicker from './AppDatePicker.vue'
import EtablissementPicker from './EtablissementPicker.vue'
import { useReferentielsStore } from '@/stores/referentiels.js'
import { libelleNiveau, aujourdhuiISO } from '@/utils/format.js'

export const INSCRIPTION_VIDE = () => ({ etablissement_id: '', niveau: '', serie_id: '', filiere_id: '', date_inscription: '' })

export default {
  name: 'InscriptionFields',
  components: { AppSelect, AppDatePicker, EtablissementPicker },
  props: {
    modelValue: { type: Object, required: true },
    erreurs: { type: Object, default: () => ({}) },
    etablissementObligatoire: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue', 'etablissement'],

  data() {
    return {
      etablissement: null, // objet complet reçu du picker
      aujourdhui: aujourdhuiISO(),
    }
  },

  computed: {
    ...mapState(useReferentielsStore, ['series', 'filieres']),
    estLycee() {
      return this.etablissement?.ordre === 'lycee'
    },
    estTechnique() {
      return this.etablissement?.ordre === 'technique_professionnel'
    },
    serieObligatoire() {
      return this.estLycee && [11, 12].includes(Number(this.modelValue.niveau))
    },
    /** Séries offertes par le lycée ; à défaut, toutes celles du référentiel. */
    optionsSeriesEtab() {
      const source = this.etablissement?.series?.length ? this.etablissement.series : this.series
      return source.map((s) => ({ valeur: s.id, libelle: `${s.code} — ${s.libelle}` }))
    },
    optionsFilieresEtab() {
      const source = this.etablissement?.filieres?.length ? this.etablissement.filieres : this.filieres
      return source.map((f) => ({ valeur: f.id, libelle: `${f.code} — ${f.libelle} (${f.diplome}, ${f.duree_annees} ans)` }))
    },
    filiereChoisie() {
      const source = this.etablissement?.filieres?.length ? this.etablissement.filieres : this.filieres
      return source.find((f) => f.id === Number(this.modelValue.filiere_id)) || null
    },
    optionsNiveaux() {
      if (!this.etablissement) return []
      let min = 1
      let max = 9
      if (this.etablissement.ordre === 'fondamental') {
        if (this.etablissement.cycles === 'premier') max = 6
        if (this.etablissement.cycles === 'second') min = 7
      } else if (this.estLycee) {
        min = 10
        max = 12
      } else if (this.estTechnique) {
        max = this.filiereChoisie?.duree_annees || 4
      }
      const niveaux = []
      for (let n = min; n <= max; n++) niveaux.push({ valeur: n, libelle: this.estTechnique ? `${n}ère/ème année` : libelleNiveau(n) })
      return niveaux
    },
    aideNiveau() {
      if (!this.etablissement) return 'Choisissez d’abord un établissement'
      if (this.estTechnique && !this.filiereChoisie) return 'Choisissez la filière pour connaître la durée'
      return ''
    },
  },

  watch: {
    // Quand l'établissement change, on prévient le parent et on nettoie les champs dépendants.
    etablissement(etab) {
      this.$emit('etablissement', etab)
    },
  },

  methods: {
    champ(nom, valeur) {
      this.$emit('update:modelValue', { ...this.modelValue, [nom]: valeur })
    },
    changerEtablissement(id) {
      this.$emit('update:modelValue', { ...this.modelValue, etablissement_id: id, niveau: '', serie_id: '', filiere_id: '' })
    },
    changerFiliere(id) {
      // La durée de la filière borne le niveau : on remet le niveau à zéro
      this.$emit('update:modelValue', { ...this.modelValue, filiere_id: id, niveau: '' })
    },
  },
}
</script>
