<!-- src/layouts/AuthLayout.vue
     Layout des pages SANS sidebar (connexion). L'habillage visuel (mise en page
     deux colonnes, logo, carte du formulaire) est entièrement géré par la vue
     elle-même (voir views/auth/LoginView.vue) ; ce layout ne fait que fournir
     un conteneur plein écran neutre. -->
<template>
  <div class="min-h-screen bg-white">
    <router-view />
  </div>
</template>

<script>
export default { name: 'AuthLayout' }
</script>
