<!-- src/components/common/AppButton.vue
     Bouton unifié. Choisit la classe CSS (btn-primary…) selon la prop `variante`
     et affiche un état « chargement » qui désactive le clic. -->
<template>
  <button
    :type="type"
    :class="[classeVariante, { 'text-sm px-3 py-1.5': taille === 'sm' }]"
    :disabled="disabled || chargement"
    :aria-busy="chargement"
  >
    <span v-if="chargement" class="inline-flex items-center gap-2">
      <AppLoader taille="sm" />
      <slot name="chargement">Patientez…</slot>
    </span>
    <slot v-else />
  </button>
</template>

<script>
export default {
  name: 'AppButton',
  props: {
    variante: {
      type: String,
      default: 'primary',
      validator: (v) => ['primary', 'success', 'danger', 'outline'].includes(v),
    },
    type: { type: String, default: 'button' }, // 'submit' dans les formulaires
    taille: { type: String, default: 'md' },   // 'md' | 'sm'
    disabled: { type: Boolean, default: false },
    chargement: { type: Boolean, default: false },
  },
  computed: {
    classeVariante() {
      return `btn-${this.variante}`
    },
  },
}
</script>
