<!-- src/layouts/TheSidebar.vue
     Menu latéral sombre (couleur brand-sidebar). Les entrées sont déclarées dans
     `menu` ci-dessous et FILTRÉES selon le rôle grâce à canSee() et aux meta.roles
     des routes : une seule source de vérité (router/index.js) pour la garde et le menu. -->
<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 w-64 bg-brand-sidebar text-slate-300 flex flex-col
           transform transition-transform duration-200 lg:translate-x-0"
    :class="ouverte ? 'translate-x-0' : '-translate-x-full'"
    aria-label="Navigation principale"
  >
    <!-- Liseré tricolore décoratif -->
    <div class="flex h-1 w-full shrink-0" aria-hidden="true">
      <span class="flex-1 bg-brand-green"></span>
      <span class="flex-1 bg-brand-gold"></span>
      <span class="flex-1 bg-brand-red"></span>
    </div>

    <!-- Logo -->
    <div class="h-16 flex items-center gap-3 px-5 border-b border-white/10">
      <div class="h-9 w-9 rounded-lg bg-brand-gold flex items-center justify-center text-brand-sidebar font-bold text-sm" aria-hidden="true">
        V
      </div>
      <div class="leading-tight">
        <p class="text-white font-semibold text-sm">{{ titreApplication }}</p>
        <p class="text-[11px] text-slate-400">Interface d'administration</p>
      </div>
      <button
        type="button"
        class="ml-auto lg:hidden p-1 rounded text-slate-400 hover:text-white"
        aria-label="Fermer le menu"
        @click="$emit('fermer')"
      >
        ✕
      </button>
    </div>

    <!-- Groupes de menu -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      <div v-for="groupe in menuVisible" :key="groupe.titre">
        <p class="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {{ groupe.titre }}
        </p>
        <ul class="space-y-0.5">
          <li v-for="entree in groupe.entrees" :key="entree.route">
            <!-- router-link ajoute automatiquement la classe active-class quand la route correspond -->
            <router-link
              :to="{ name: entree.route, params: entree.params }"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
                     hover:bg-white/5 hover:text-white transition-colors"
              active-class="bg-brand-gold text-brand-sidebar font-semibold shadow-sm hover:bg-brand-gold"
            >
              <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" :d="icones[entree.icone]" />
              </svg>
              <span class="truncate">{{ entree.libelle }}</span>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Pied : périmètre -->
    <div class="px-5 py-4 border-t border-white/10 text-xs">
      <p class="text-slate-500">Périmètre</p>
      <p class="text-white font-medium truncate" :title="perimetreLibelle">{{ perimetreLibelle }}</p>
    </div>
  </aside>
</template>

<script>
import { mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'

import { canSee } from '@/utils/permissions.js'

const titreApplication = import.meta.env.VITE_APP_TITLE || 'Mon application Vue'

export default {
  name: 'TheSidebar',
  props: {
    ouverte: { type: Boolean, default: false }, // état mobile
  },
  emits: ['fermer'],

  data() {
    return {
      titreApplication,
      // Chaque entrée référence une route par son `name` (voir router/index.js).
      menu: [
        {
          titre: 'Général',
          entrees: [
            { route: 'tableau-de-bord', libelle: 'Tableau de bord', icone: 'maison' },
            { route: 'statistiques', libelle: 'Statistiques', icone: 'graphique' },
            { route: 'guide-crud', libelle: 'Guide API et CRUD', icone: 'liste' },
          ],
        },
        {
          titre: 'Élèves',
          entrees: [
            { route: 'eleves', libelle: 'Liste des élèves', icone: 'eleves' },
            { route: 'eleve-nouveau', libelle: 'Nouvelle inscription', icone: 'plus' },
            { route: 'recherche-nationale', libelle: 'Recherche par matricule', icone: 'loupe' },
            { route: 'transferts', libelle: 'Transferts', icone: 'transfert' },
          ],
        },
        {
          titre: 'Examens',
          entrees: [
            { route: 'candidats', libelle: 'Candidats', icone: 'diplome' },
            { route: 'candidature-nouvelle', libelle: 'Nouvelle candidature', icone: 'plus' },
          ],
        },
        {
          titre: 'Référentiels',
          entrees: [
            { route: 'academies', libelle: 'Académies', icone: 'batiment' },
            { route: 'caps', libelle: 'CAP', icone: 'batiment' },
            { route: 'etablissements', libelle: 'Établissements', icone: 'ecole' },
            { route: 'series', libelle: 'Séries', icone: 'liste' },
            { route: 'filieres', libelle: 'Filières', icone: 'liste' },
            { route: 'annees-scolaires', libelle: 'Années scolaires', icone: 'calendrier' },
          ],
        },
        {
          titre: 'Administration',
          entrees: [
            { route: 'utilisateurs', libelle: 'Utilisateurs', icone: 'utilisateurs' },
            { route: 'roles', libelle: 'Rôles et permissions', icone: 'bouclier' },
          ],
        },
      ],
      menuDemo: [
        {
          titre: 'Espace de démonstration',
          entrees: [
            { route: 'tableau-de-bord', libelle: 'Tableau de bord', icone: 'maison' },
            { route: 'demo-ressource', params: { ressource: 'produits' }, libelle: 'Produits', icone: 'liste' },
            { route: 'demo-ressource', params: { ressource: 'commandes' }, libelle: 'Commandes', icone: 'transfert' },
            { route: 'demo-ressource', params: { ressource: 'clients' }, libelle: 'Clients', icone: 'utilisateurs' },
            { route: 'guide-crud', libelle: 'Guide API et CRUD', icone: 'liste' },
          ],
        },
      ],

      // Tracés SVG (Heroicons, licence MIT) référencés par les entrées ci-dessus.
      icones: {
        maison: 'M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75',
        graphique: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
        eleves: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
        plus: 'M12 4.5v15m7.5-7.5h-15',
        loupe: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
        transfert: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
        diplome: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0',
        batiment: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
        ecole: 'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z',
        liste: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
        calendrier: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
        utilisateurs: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
        bouclier: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
      },
    }
  },

  computed: {
    ...mapState(useAuthStore, ['role', 'perimetreLibelle']),

    /**
     * Menu filtré : on ne garde que les entrées dont la route est autorisée
     * pour le rôle courant, puis on supprime les groupes devenus vides.
     */
    menuVisible() {
      const menu = import.meta.env.VITE_DEMO_MODE === 'true' ? this.menuDemo : this.menu
      return menu
        .map((groupe) => ({
          ...groupe,
          entrees: groupe.entrees.filter((entree) => {
            // $router.resolve() nous donne la route (et donc ses meta) à partir de son nom
            const route = this.$router.resolve({ name: entree.route, params: entree.params })
            return canSee(route, this.role)
          }),
        }))
        .filter((groupe) => groupe.entrees.length > 0)
    },
  },
}
</script>
