// src/services/api.js
// Instance Axios unique, partagée par tous les services.
// Rôle : connaître l'URL de l'API, ajouter le jeton à chaque requête,
// et traduire les erreurs HTTP en messages exploitables par les pages.
import axios from 'axios'

// Clé utilisée pour stocker le jeton dans le navigateur (localStorage).
// Centralisée ici pour que le store auth et l'intercepteur utilisent la même.
export const CLE_JETON = 'vue_app_jeton'

const api = axios.create({
  // Placeholder : la valeur vient du fichier .env (voir .env.example)
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 20000, // 20 s : au-delà on considère le serveur injoignable
})

// ---------------------------------------------------------------------------
// Intercepteur de REQUÊTE : exécuté avant chaque appel.
// Si un jeton est présent, on l'ajoute dans l'en-tête Authorization (Sanctum).
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const jeton = localStorage.getItem(CLE_JETON)
  // La session locale de démonstration n'est pas un jeton API valide.
  if (jeton && jeton !== 'session-demo-locale') {
    config.headers.Authorization = `Bearer ${jeton}`
  }
  return config
})

// ---------------------------------------------------------------------------
// Intercepteur de RÉPONSE : exécuté après chaque appel.
// - Succès : on renvoie la réponse telle quelle (les services liront `donnees`).
// - Erreur : on construit un objet d'erreur uniforme { statut, message, erreurs }.
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    // Pas de réponse du tout : réseau coupé, serveur éteint, CORS, timeout…
    if (!erreur.response) {
      return Promise.reject({
        statut: 0,
        message: 'Serveur injoignable. Vérifiez votre connexion internet.',
        erreurs: null,
      })
    }

    const { status, data } = erreur.response
    // L'API renvoie toujours l'enveloppe { donnees, message, erreurs }
    const messageApi = data?.message

    switch (status) {
      case 401:
        // Jeton absent ou invalide : on nettoie et on renvoie vers la connexion.
        const sessionLocale = localStorage.getItem(CLE_JETON) === 'session-demo-locale'
        if (!sessionLocale) localStorage.removeItem(CLE_JETON)
        if (!sessionLocale && window.location.pathname !== '/connexion') {
          window.location.assign('/connexion')
        }
        return Promise.reject({
          statut: 401,
          message: messageApi || 'Session expirée, veuillez vous reconnecter.',
          erreurs: null,
        })

      case 403:
        return Promise.reject({
          statut: 403,
          message: messageApi || 'Accès non autorisé à cette ressource.',
          erreurs: null,
        })

      case 404:
        return Promise.reject({
          statut: 404,
          message: messageApi || 'Ressource introuvable.',
          erreurs: null,
        })

      case 409:
        // Conflit métier : doublon, transfert déjà traité, aucune année active…
        return Promise.reject({
          statut: 409,
          message: messageApi || 'Conflit : cette opération est impossible dans l’état actuel.',
          erreurs: null,
        })

      case 422:
        // Erreurs de validation : `erreurs` = { champ: [messages] } à afficher sous chaque champ.
        return Promise.reject({
          statut: 422,
          message: messageApi || 'Certains champs sont invalides.',
          erreurs: data?.erreurs || null,
        })

      default:
        // 500 et autres
        return Promise.reject({
          statut: status,
          message: messageApi || 'Erreur interne du serveur. Réessayez plus tard.',
          erreurs: null,
        })
    }
  }
)

// ---------------------------------------------------------------------------
// Petits utilitaires pour éviter de répéter reponse.data.donnees partout.
// ---------------------------------------------------------------------------

/** Renvoie directement `donnees` d'une réponse API. */
export function extraireDonnees(reponse) {
  return reponse.data?.donnees
}

/**
 * Renvoie { elements, pagination } d'une réponse de liste.
 * Utile pour AppTable + AppPagination.
 */
export function extraireListe(reponse) {
  const donnees = extraireDonnees(reponse) || {}
  return {
    elements: donnees.elements || [],
    pagination: donnees.pagination || { page: 1, par_page: 15, total: 0, total_pages: 1 },
  }
}

/**
 * Supprime les paramètres vides ('' / null / undefined) avant de les envoyer
 * en query string : l'API préfère l'absence d'un filtre à une valeur vide.
 */
export function nettoyerParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )
}

export default api
