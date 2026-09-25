<!-- src/components/forms/EtatCivilFields.vue
     Champs d'état civil d'un élève (schéma EtatCivil de l'API), partagés par la création
     et la modification. v-model = objet { prenom, nom, sexe, date_naissance, … }.
     Chaque saisie émet une copie de l'objet avec le champ modifié (immutabilité simple). -->
<template>
  <div class="space-y-5">
    <section>
      <h3 class="text-sm font-semibold text-slate-700 mb-3">Identité</h3>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AppInput :model-value="modelValue.prenom" label="Prénom" obligatoire :erreur="erreurs.prenom" @update:model-value="champ('prenom', $event)" />
        <AppInput :model-value="modelValue.nom" label="Nom" obligatoire :erreur="erreurs.nom" @update:model-value="champ('nom', $event)" />
        <AppSelect :model-value="modelValue.sexe" label="Sexe" :options="optionsSexe" obligatoire :erreur="erreurs.sexe" @update:model-value="champ('sexe', $event)" />
        <AppDatePicker :model-value="modelValue.date_naissance" label="Date de naissance" obligatoire :max="aujourdhui" :erreur="erreurs.date_naissance" @update:model-value="champ('date_naissance', $event)" />
        <AppInput :model-value="modelValue.lieu_naissance" label="Lieu de naissance" obligatoire :erreur="erreurs.lieu_naissance" @update:model-value="champ('lieu_naissance', $event)" />
        <AppInput :model-value="modelValue.numero_acte_naissance" label="N° acte de naissance" placeholder="AN-2019-004512" :erreur="erreurs.numero_acte_naissance" @update:model-value="champ('numero_acte_naissance', $event)" />
      </div>
    </section>

    <section>
      <h3 class="text-sm font-semibold text-slate-700 mb-3">Parents / tuteur</h3>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AppInput :model-value="modelValue.prenom_pere" label="Prénom du père" :erreur="erreurs.prenom_pere" @update:model-value="champ('prenom_pere', $event)" />
        <AppInput :model-value="modelValue.nom_pere" label="Nom du père" :erreur="erreurs.nom_pere" @update:model-value="champ('nom_pere', $event)" />
        <AppInput :model-value="modelValue.contact_pere" label="Contact du père" type="tel" placeholder="+223 …" :erreur="erreurs.contact_pere" @update:model-value="champ('contact_pere', $event)" />
        <AppInput :model-value="modelValue.prenom_mere" label="Prénom de la mère" :erreur="erreurs.prenom_mere" @update:model-value="champ('prenom_mere', $event)" />
        <AppInput :model-value="modelValue.nom_mere" label="Nom de la mère" :erreur="erreurs.nom_mere" @update:model-value="champ('nom_mere', $event)" />
        <AppInput :model-value="modelValue.contact_mere" label="Contact de la mère" type="tel" :erreur="erreurs.contact_mere" @update:model-value="champ('contact_mere', $event)" />
        <AppInput :model-value="modelValue.tuteur" label="Tuteur (si différent)" :erreur="erreurs.tuteur" @update:model-value="champ('tuteur', $event)" />
        <AppInput :model-value="modelValue.contact_tuteur" label="Contact du tuteur" type="tel" :erreur="erreurs.contact_tuteur" @update:model-value="champ('contact_tuteur', $event)" />
      </div>
    </section>
  </div>
</template>

<script>
import AppInput from './AppInput.vue'
import AppSelect from './AppSelect.vue'
import AppDatePicker from './AppDatePicker.vue'
import { optionsDepuis, aujourdhuiISO } from '@/utils/format.js'

/** Objet vide prêt pour v-model (exporté pour les pages). */
export const ETAT_CIVIL_VIDE = () => ({
  prenom: '', nom: '', sexe: '', date_naissance: '', lieu_naissance: '', numero_acte_naissance: '',
  prenom_pere: '', nom_pere: '', contact_pere: '', prenom_mere: '', nom_mere: '', contact_mere: '',
  tuteur: '', contact_tuteur: '',
})

export default {
  name: 'EtatCivilFields',
  components: { AppInput, AppSelect, AppDatePicker },
  props: {
    modelValue: { type: Object, required: true },
    erreurs: { type: Object, default: () => ({}) }, // erreurs 422 par champ
  },
  emits: ['update:modelValue'],
  data() {
    return { optionsSexe: optionsDepuis('sexe'), aujourdhui: aujourdhuiISO() }
  },
  methods: {
    champ(nom, valeur) {
      this.$emit('update:modelValue', { ...this.modelValue, [nom]: valeur })
    },
  },
}
</script>
