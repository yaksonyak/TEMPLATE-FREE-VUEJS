<!-- src/views/erreurs/AccesRefuseView.vue
     Affichée par la garde du router quand le rôle n'est pas autorisé (équivalent du 403). -->
<template>
  <div class="flex items-center justify-center py-24">
    <div class="text-center space-y-3">
      <p class="text-5xl font-bold text-cnece-gold">403</p>
      <h1 class="text-xl font-semibold text-slate-800">Accès refusé</h1>
      <p class="text-sm text-slate-500 max-w-sm">
        Cette page est hors de votre périmètre. Chaque acteur ne voit et ne modifie
        que les données de son périmètre géographique et administratif.
      </p>
      <router-link :to="{ name: 'tableau-de-bord' }" class="btn-primary inline-block">
        Retour au tableau de bord
      </router-link>
    </div>
  </div>
</template>

<script>
export default { name: 'AccesRefuseView' }
</script>
