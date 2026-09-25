// src/router/index.js
// Déclaration de toutes les routes + garde d'authentification par rôle.
//
// Chaque route porte des métadonnées (meta) :
//   - titre   : affiché dans l'onglet du navigateur et l'en-tête
//   - public  : true pour les pages accessibles SANS connexion (login)
//   - roles   : liste des rôles autorisés ; absent = tous les rôles connectés
//
// Les composants sont chargés « à la demande » (import dynamique) :
// le navigateur ne télécharge le code d'une page que quand on y va.
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { ROLES, ROLES_GESTION, canSee } from '@/utils/permissions.js'

const routes = [
  // ----------------------------------------------------------- LAYOUT AUTH (sans sidebar)
  {
    path: '/connexion',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        name: 'connexion',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { titre: 'Connexion', public: true },
      },
    ],
  },

  // ----------------------------------------------------------- LAYOUT PAR DÉFAUT (sidebar + en-tête)
  // Toutes les pages connectées sont des « enfants » de ce layout :
  // leur chemin est relatif ('eleves' → '/eleves') et leurs meta s'ajoutent à celles du parent.
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: { name: 'tableau-de-bord' },
    children: [
      // ----------------------------------------------------------- ACCUEIL
      {
        path: 'tableau-de-bord',
        name: 'tableau-de-bord',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { titre: 'Tableau de bord' },
      },
      {
        path: 'demo/:ressource',
        name: 'demo-ressource',
        component: () => import('@/views/demo/DemoResourceView.vue'),
        props: true,
        meta: { titre: 'Exemples' },
      },
      {
        path: 'guide-crud',
        name: 'guide-crud',
        component: () => import('@/views/docs/GuideCrudView.vue'),
        meta: { titre: 'Guide API et CRUD' },
      },

      // ----------------------------------------------------------- RÉFÉRENTIELS
      {
        path: 'referentiels/academies',
        name: 'academies',
        component: () => import('@/views/referentiels/AcademiesView.vue'),
        meta: { titre: 'Académies', roles: [ROLES.ADMIN_NATIONAL, ROLES.ADMIN_ACADEMIE] },
      },
      {
        path: 'referentiels/caps',
        name: 'caps',
        component: () => import('@/views/referentiels/CapView.vue'),
        meta: { titre: 'CAP', roles: [ROLES.ADMIN_NATIONAL, ROLES.ADMIN_ACADEMIE] },
      },
      {
        path: 'referentiels/etablissements',
        name: 'etablissements',
        component: () => import('@/views/referentiels/EtablissementsView.vue'),
        meta: {
          titre: 'Établissements',
          roles: [ROLES.ADMIN_NATIONAL, ROLES.ADMIN_ACADEMIE, ROLES.AGENT_CAP],
        },
      },
      {
        path: 'referentiels/series',
        name: 'series',
        component: () => import('@/views/referentiels/SeriesView.vue'),
        meta: { titre: 'Séries du lycée' },
      },
      {
        path: 'referentiels/filieres',
        name: 'filieres',
        component: () => import('@/views/referentiels/FilieresView.vue'),
        meta: { titre: 'Filières techniques' },
      },
      {
        path: 'referentiels/annees-scolaires',
        name: 'annees-scolaires',
        component: () => import('@/views/referentiels/AnneesScolairesView.vue'),
        meta: { titre: 'Années scolaires', roles: [ROLES.ADMIN_NATIONAL] },
      },

      // ----------------------------------------------------------- ÉLÈVES
      {
        path: 'eleves',
        name: 'eleves',
        component: () => import('@/views/eleves/ElevesListView.vue'),
        meta: { titre: 'Élèves', roles: ROLES_GESTION },
      },
      {
        path: 'eleves/nouveau',
        name: 'eleve-nouveau',
        component: () => import('@/views/eleves/EleveCreateView.vue'),
        meta: { titre: 'Nouvel élève', roles: ROLES_GESTION },
      },
      {
        path: 'eleves/recherche',
        name: 'recherche-nationale',
        component: () => import('@/views/eleves/RechercheNationaleView.vue'),
        meta: { titre: 'Recherche nationale', roles: ROLES_GESTION },
      },
      {
        path: 'eleves/:id(\\d+)',
        name: 'eleve-detail',
        component: () => import('@/views/eleves/EleveDetailView.vue'),
        props: true, // l'id de l'URL devient une prop du composant
        meta: { titre: "Fiche élève", roles: ROLES_GESTION },
      },
      {
        path: 'transferts',
        name: 'transferts',
        component: () => import('@/views/eleves/TransfertsView.vue'),
        meta: { titre: 'Transferts', roles: ROLES_GESTION },
      },

      // ----------------------------------------------------------- EXAMENS
      {
        path: 'candidats',
        name: 'candidats',
        component: () => import('@/views/examens/CandidatsView.vue'),
        meta: { titre: 'Candidats aux examens', roles: ROLES_GESTION },
      },
      {
        path: 'candidats/nouvelle',
        name: 'candidature-nouvelle',
        component: () => import('@/views/examens/CandidatureView.vue'),
        meta: { titre: 'Nouvelle candidature', roles: ROLES_GESTION },
      },

      // ----------------------------------------------------------- UTILISATEURS
      {
        path: 'utilisateurs',
        name: 'utilisateurs',
        component: () => import('@/views/utilisateurs/UtilisateursView.vue'),
        meta: { titre: 'Utilisateurs', roles: [ROLES.ADMIN_NATIONAL, ROLES.ADMIN_ACADEMIE] },
      },
      {
        path: 'utilisateurs/roles',
        name: 'roles',
        component: () => import('@/views/utilisateurs/RolesView.vue'),
        meta: { titre: 'Rôles et permissions', roles: [ROLES.ADMIN_NATIONAL] },
      },

      // ----------------------------------------------------------- STATISTIQUES
      {
        path: 'statistiques',
        name: 'statistiques',
        component: () => import('@/views/statistiques/StatistiquesView.vue'),
        meta: { titre: 'Statistiques' },
      },

      // ----------------------------------------------------------- ERREURS
      {
        path: 'acces-refuse',
        name: 'acces-refuse',
        component: () => import('@/views/erreurs/AccesRefuseView.vue'),
        meta: { titre: 'Accès refusé' },
      },
      {
        path: ':pathMatch(.*)*',
        name: 'introuvable',
        component: () => import('@/views/erreurs/IntrouvableView.vue'),
        meta: { titre: 'Page introuvable' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(), // URLs propres, sans « # »
  routes,
})

// ---------------------------------------------------------------------------
// GARDE GLOBALE : exécutée avant CHAQUE changement de page.
// Renvoyer `true` laisse passer ; renvoyer une route redirige.
// ---------------------------------------------------------------------------
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const modeDemo = import.meta.env.VITE_DEMO_MODE === 'true'

  // 1. Un jeton existe (rechargement de page) mais le profil n'est pas encore chargé :
  //    on interroge GET /auth/compte avant de décider.
  if (auth.jeton && !auth.utilisateur) {
    try {
      await auth.fetchUser()
    } catch {
      // jeton invalide : fetchUser a déjà nettoyé l'état, on continue déconnecté
    }
  }

  // 2. Page publique (connexion) : si déjà connecté, on renvoie vers l'accueil.
  if (to.meta.public) {
    return auth.estConnecte ? { name: 'tableau-de-bord' } : true
  }

  if (modeDemo && !['tableau-de-bord', 'demo-ressource', 'guide-crud', 'acces-refuse', 'introuvable'].includes(to.name)) {
    return { name: 'tableau-de-bord' }
  }

  // 3. Page protégée sans connexion : vers le login, en mémorisant la page voulue.
  if (!auth.estConnecte) {
    return { name: 'connexion', query: { redirection: to.fullPath } }
  }

  // 4. Connecté mais rôle non autorisé pour cette route.
  if (!canSee(to, auth.role)) {
    return { name: 'acces-refuse' }
  }

  return true
})

// Met à jour le titre de l'onglet après chaque navigation.
router.afterEach((to) => {
  const titreApp = import.meta.env.VITE_APP_TITLE || 'Mon application Vue'
  document.title = to.meta.titre ? `${to.meta.titre} — ${titreApp}` : titreApp
})

export default router
