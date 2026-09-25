<!-- src/components/forms/AppInput.vue
     Champ texte/nombre/email/tel avec label, aide et erreur de validation (422).
     Compatible v-model grâce à la prop `modelValue` et l'événement `update:modelValue`. -->
<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-slate-700 mb-1">
      {{ label }} <span v-if="obligatoire" class="text-cnece-danger" aria-hidden="true">*</span>
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="obligatoire"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      :maxlength="maxlength"
      :autocomplete="autocomplete"
      :aria-invalid="Boolean(messageErreur)"
      :aria-describedby="messageErreur ? `${id}-erreur` : aide ? `${id}-aide` : null"
      class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cnece-accent focus:border-cnece-accent disabled:bg-slate-100 disabled:text-slate-500"
      :class="messageErreur ? 'border-cnece-danger' : 'border-slate-300'"
      @input="$emit('update:modelValue', type === 'number' ? versNombre($event.target.value) : $event.target.value)"
    />
    <p v-if="messageErreur" :id="`${id}-erreur`" class="mt-1 text-xs text-cnece-danger">{{ messageErreur }}</p>
    <p v-else-if="aide" :id="`${id}-aide`" class="mt-1 text-xs text-slate-500">{{ aide }}</p>
  </div>
</template>

<script>
let compteur = 0

export default {
  name: 'AppInput',
  props: {
    modelValue: { type: [String, Number], default: '' },
    label: { type: String, required: true },
    type: { type: String, default: 'text' },
    placeholder: { type: String, default: '' },
    aide: { type: String, default: '' },
    /** Erreur : chaîne, ou tableau de messages tel que renvoyé par l'API (`erreurs.champ`). */
    erreur: { type: [String, Array], default: '' },
    obligatoire: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    min: { type: [String, Number], default: undefined },
    max: { type: [String, Number], default: undefined },
    step: { type: [String, Number], default: undefined },
    maxlength: { type: [String, Number], default: undefined },
    autocomplete: { type: String, default: 'off' },
  },
  emits: ['update:modelValue'],
  data() {
    return { id: `champ-${++compteur}` }
  },
  computed: {
    messageErreur() {
      return Array.isArray(this.erreur) ? this.erreur[0] || '' : this.erreur
    },
  },
  methods: {
    /** '' reste '' (champ vidé), sinon conversion en nombre. */
    versNombre(valeur) {
      return valeur === '' ? '' : Number(valeur)
    },
  },
}
</script>
