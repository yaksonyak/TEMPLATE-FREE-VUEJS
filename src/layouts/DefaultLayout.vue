<!-- src/layouts/DefaultLayout.vue
     Layout de toutes les pages connectées :
       [ Sidebar sombre filtrée par rôle ] [ En-tête + zone de contenu ]
     Sur mobile (< lg), la sidebar est cachée et s'ouvre avec le bouton ☰ de l'en-tête. -->
<template>
  <div class="min-h-screen flex bg-cnece-bg">
    <!-- Sidebar : fixe à gauche sur grand écran, coulissante sur mobile -->
    <TheSidebar :ouverte="sidebarOuverte" @fermer="sidebarOuverte = false" />

    <!-- Voile sombre derrière la sidebar mobile -->
    <div
      v-if="sidebarOuverte"
      class="fixed inset-0 z-30 bg-black/40 lg:hidden"
      aria-hidden="true"
      @click="sidebarOuverte = false"
    />

    <!-- Colonne de droite : en-tête + contenu. lg:pl-64 laisse la place à la sidebar. -->
    <div class="flex-1 flex flex-col min-w-0 lg:pl-64">
      <TheHeader @ouvrir-menu="sidebarOuverte = true" />

      <main class="flex-1 p-4 sm:p-6 lg:p-8">
        <!-- :key force le rechargement du composant quand on change de page
             (utile pour repartir d'un état propre entre deux fiches) -->
        <router-view :key="$route.fullPath" />
      </main>
    </div>
  </div>
</template>

<script>
import TheSidebar from './TheSidebar.vue'
import TheHeader from './TheHeader.vue'

export default {
  name: 'DefaultLayout',
  components: { TheSidebar, TheHeader },
  data() {
    return {
      sidebarOuverte: false, // état du menu mobile uniquement
    }
  },
  watch: {
    // Quand on navigue, on referme le menu mobile.
    '$route.fullPath'() {
      this.sidebarOuverte = false
    },
  },
}
</script>
