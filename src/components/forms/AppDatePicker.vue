<!-- src/components/forms/AppDatePicker.vue
     Sélecteur de date natif. La valeur est au format YYYY-MM-DD,
     exactement celui attendu par l'API (date_naissance, date_inscription). -->
<template>
  <AppInput
    type="date"
    :model-value="modelValue"
    :label="label"
    :aide="aide"
    :erreur="erreur"
    :obligatoire="obligatoire"
    :disabled="disabled"
    :min="min"
    :max="max"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script>
import AppInput from './AppInput.vue'

export default {
  name: 'AppDatePicker',
  components: { AppInput },
  props: {
    modelValue: { type: String, default: '' },
    label: { type: String, required: true },
    aide: { type: String, default: '' },
    erreur: { type: [String, Array], default: '' },
    obligatoire: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    min: { type: String, default: undefined },
    max: { type: String, default: undefined },
  },
  emits: ['update:modelValue'],
}
</script>
