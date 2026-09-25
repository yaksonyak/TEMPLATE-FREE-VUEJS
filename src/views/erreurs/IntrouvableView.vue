<!-- src/views/erreurs/IntrouvableView.vue — route inconnue (404). -->
<template>
  <div class="flex items-center justify-center py-24">
    <div class="text-center space-y-3">
      <p class="text-5xl font-bold text-slate-300">404</p>
      <h1 class="text-xl font-semibold text-slate-800">Page introuvable</h1>
      <p class="text-sm text-slate-500">L'adresse demandée n'existe pas.</p>
      <router-link :to="{ name: 'tableau-de-bord' }" class="btn-primary inline-block">
        Retour au tableau de bord
      </router-link>
    </div>
  </div>
</template>

<script>
export default { name: 'IntrouvableView' }
</script>
