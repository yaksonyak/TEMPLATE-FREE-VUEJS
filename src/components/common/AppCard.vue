<!-- src/components/common/AppCard.vue
     Carte blanche avec en-tête optionnel (titre, sous-titre, zone d'actions)
     et pied optionnel. Sert de conteneur standard à toutes les pages. -->
<template>
  <section class="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-200 overflow-hidden">
    <header
      v-if="titre || $slots.actions"
      class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b-2 border-cnece-primary/20 bg-gradient-to-r from-slate-50 to-white"
    >
      <div>
        <h2 class="text-lg font-semibold text-cnece-primary">{{ titre }}</h2>
        <p v-if="sousTitre" class="text-sm text-slate-500 mt-0.5">{{ sousTitre }}</p>
      </div>
      <div class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </header>

    <div :class="sansMarge ? '' : 'p-5'">
      <slot />
    </div>

    <footer v-if="$slots.pied" class="px-5 py-3 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 rounded-b-xl">
      <slot name="pied" />
    </footer>
  </section>
</template>

<script>
export default {
  name: 'AppCard',
  props: {
    titre: { type: String, default: '' },
    sousTitre: { type: String, default: '' },
    sansMarge: { type: Boolean, default: false },
  },
}
</script>
