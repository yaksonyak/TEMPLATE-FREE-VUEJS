<!-- src/components/forms/AppSelect.vue
     Liste déroulante avec label et erreur. Les options sont des objets
     { valeur, libelle } (voir optionsDepuis() dans format.js) ou des objets API
     dont on précise les clés via `cleValeur` / `cleLibelle` (ex. id / nom). -->
<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-slate-700 mb-1">
      {{ label }} <span v-if="obligatoire" class="text-cnece-danger" aria-hidden="true">*</span>
    </label>
    <select
      :id="id"
      :value="modelValue"
      :required="obligatoire"
      :disabled="disabled || chargement"
      :aria-invalid="Boolean(messageErreur)"
      class="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cnece-accent focus:border-cnece-accent disabled:bg-slate-100 disabled:text-slate-500"
      :class="messageErreur ? 'border-cnece-danger' : 'border-slate-300'"
      @change="changer($event.target.value)"
    >
      <option value="">{{ chargement ? 'Chargement…' : placeholder }}</option>
      <option v-for="option in optionsNormalisees" :key="option.valeur" :value="option.valeur">
        {{ option.libelle }}
      </option>
    </select>
    <p v-if="messageErreur" class="mt-1 text-xs text-cnece-danger">{{ messageErreur }}</p>
    <p v-else-if="aide" class="mt-1 text-xs text-slate-500">{{ aide }}</p>
  </div>
</template>

<script>
let compteur = 0

export default {
  name: 'AppSelect',
  props: {
    modelValue: { type: [String, Number, null], default: '' },
    label: { type: String, required: true },
    options: { type: Array, default: () => [] },
    cleValeur: { type: String, default: 'valeur' },   // 'id' pour un objet API
    cleLibelle: { type: String, default: 'libelle' }, // 'nom' pour un objet API
    placeholder: { type: String, default: '— Sélectionner —' },
    aide: { type: String, default: '' },
    erreur: { type: [String, Array], default: '' },
    obligatoire: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    chargement: { type: Boolean, default: false },
    /** true : la valeur émise est convertie en nombre (identifiants API). */
    numerique: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  data() {
    return { id: `select-${++compteur}` }
  },
  computed: {
    optionsNormalisees() {
      return this.options.map((o) => ({ valeur: o[this.cleValeur], libelle: o[this.cleLibelle] }))
    },
    messageErreur() {
      return Array.isArray(this.erreur) ? this.erreur[0] || '' : this.erreur
    },
  },
  methods: {
    changer(valeur) {
      if (valeur === '') return this.$emit('update:modelValue', '')
      this.$emit('update:modelValue', this.numerique ? Number(valeur) : valeur)
    },
  },
}
</script>
