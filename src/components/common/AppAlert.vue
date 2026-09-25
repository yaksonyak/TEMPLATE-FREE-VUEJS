<!-- src/components/common/AppAlert.vue
     Message d'information / succès / avertissement / erreur.
     Sait afficher l'objet `erreurs` renvoyé par l'API en 422 ({ champ: [messages] }). -->
<template>
  <div v-if="message || aDesErreurs" role="alert" class="rounded-lg border px-4 py-3 text-sm" :class="classes">
    <div class="flex items-start gap-3">
      <span class="font-bold shrink-0" aria-hidden="true">{{ symbole }}</span>
      <div class="flex-1 min-w-0">
        <p v-if="message" class="font-medium">{{ message }}</p>
        <ul v-if="aDesErreurs" class="mt-1 list-disc list-inside space-y-0.5">
          <li v-for="(messages, champ) in erreurs" :key="champ">
            <span class="font-medium">{{ champ }}</span> : {{ messages.join(' ') }}
          </li>
        </ul>
      </div>
      <button
        v-if="fermable"
        type="button"
        class="shrink-0 opacity-60 hover:opacity-100"
        aria-label="Fermer le message"
        @click="$emit('fermer')"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppAlert',
  props: {
    type: {
      type: String,
      default: 'info',
      validator: (v) => ['info', 'succes', 'avertissement', 'erreur'].includes(v),
    },
    message: { type: String, default: '' },
    erreurs: { type: Object, default: null }, // { email: ['…'], niveau: ['…'] }
    fermable: { type: Boolean, default: false },
  },
  emits: ['fermer'],
  computed: {
    aDesErreurs() {
      return this.erreurs && Object.keys(this.erreurs).length > 0
    },
    classes() {
      return {
        info: 'border-blue-200 bg-blue-50 text-blue-800',
        succes: 'border-green-200 bg-green-50 text-cnece-accent',
        avertissement: 'border-amber-200 bg-amber-50 text-cnece-gold',
        erreur: 'border-red-200 bg-red-50 text-cnece-danger',
      }[this.type]
    },
    symbole() {
      return { info: 'i', succes: '✓', avertissement: '!', erreur: '✕' }[this.type]
    },
  },
}
</script>
