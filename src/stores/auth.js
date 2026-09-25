// src/stores/auth.js
// Store Pinia « auth » : l'état global de connexion, partagé par toute l'application.
// Écrit avec la syntaxe Options (state / getters / actions), la plus proche
// de ce que vous connaissez avec data / computed / methods dans un composant.
import { defineStore } from 'pinia'
import authService from '@/services/auth.service.js'
import { CLE_JETON } from '@/services/api.js'
import { libelleRole } from '@/utils/permissions.js'

const MODE_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'
const COMPTE_DEMO = {
  utilisateur: {
    id: 1,
    nom: 'Démo',
    prenom: 'Utilisateur',
    nom_complet: 'Utilisateur Démo',
    email: 'admin@example.com',
    role: 'admin_national',
    actif: true,
  },
  perimetre: { niveau: 'national' },
}
const JETON_DEMO = 'session-demo-locale'

export const useAuthStore = defineStore('auth', {
  // ---------------------------------------------------------------- STATE
  // Équivalent de data() : les données réactives.
  state: () => ({
    // Au démarrage, on relit le jeton éventuellement mémorisé dans le navigateur.
    jeton: localStorage.getItem(CLE_JETON) || null,
    utilisateur: null, // { id, nom, prenom, nom_complet, email, role, actif, ... }
    perimetre: null,   // { niveau, academie, cap, etablissement }
    chargement: false,
    erreur: null,      // message d'erreur de la dernière action
  }),

  // ---------------------------------------------------------------- GETTERS
  // Équivalent de computed : des valeurs dérivées de l'état.
  getters: {
    /** Vrai si on a un jeton ET un utilisateur chargé. */
    estConnecte: (state) => Boolean(state.jeton && state.utilisateur),

    /** Rôle brut (ex. 'agent_cap') ou null. */
    role: (state) => state.utilisateur?.role || null,

    /** Libellé lisible du rôle (ex. 'Agent CAP'). */
    roleLibelle: (state) => libelleRole(state.utilisateur?.role),

    /** Nom affiché dans l'en-tête. */
    nomComplet: (state) =>
      state.utilisateur?.nom_complet ||
      [state.utilisateur?.prenom, state.utilisateur?.nom].filter(Boolean).join(' '),

    /** 'national' | 'academie' | 'cap' | 'etablissement' | 'consultation' */
    niveauPerimetre: (state) => state.perimetre?.niveau || null,

    /**
     * Description courte du périmètre pour l'en-tête,
     * ex. « CAP de Banconi » ou « Tout le territoire ».
     */
    perimetreLibelle: (state) => {
      const p = state.perimetre
      if (!p) return ''
      switch (p.niveau) {
        case 'national':
          return 'Tout le territoire'
        case 'academie':
          return p.academie?.nom || 'Académie'
        case 'cap':
          return p.cap?.nom || 'CAP'
        case 'etablissement':
          return p.etablissement?.nom || 'Établissement'
        case 'consultation':
          return 'Lecture seule'
        default:
          return ''
      }
    },
  },

  // ---------------------------------------------------------------- ACTIONS
  // Équivalent de methods : peuvent être asynchrones et modifier l'état.
  actions: {
    /**
     * Connexion : appelle l'API, mémorise le jeton, l'utilisateur et le périmètre.
     * Lève l'erreur (déjà normalisée par api.js) pour que la page l'affiche.
     */
    async login(email, motDePasse) {
      this.chargement = true
      this.erreur = null
      try {
        if (MODE_DEMO) {
          if (email !== 'admin@example.com' || motDePasse !== 'votre_mot_de_passe') {
            throw { message: 'En mode démo, utilisez les identifiants affichés dans le formulaire.' }
          }
          this.jeton = JETON_DEMO
          this.utilisateur = COMPTE_DEMO.utilisateur
          this.perimetre = COMPTE_DEMO.perimetre
          localStorage.setItem(CLE_JETON, JETON_DEMO)
          return { jeton: JETON_DEMO, ...COMPTE_DEMO }
        }

        const donnees = await authService.connexion(email, motDePasse)
        this.jeton = donnees.jeton
        this.utilisateur = donnees.utilisateur
        this.perimetre = donnees.perimetre
        localStorage.setItem(CLE_JETON, donnees.jeton)
        return donnees
      } catch (e) {
        this.erreur = e.message
        throw e
      } finally {
        this.chargement = false
      }
    },

    /**
     * Recharge le profil depuis GET /auth/compte.
     * Utilisé au démarrage de l'app quand un jeton existe déjà dans localStorage.
     */
    async fetchUser() {
      if (!this.jeton) return null
      if (MODE_DEMO && this.jeton === JETON_DEMO) {
        this.utilisateur = COMPTE_DEMO.utilisateur
        this.perimetre = COMPTE_DEMO.perimetre
        return COMPTE_DEMO
      }
      this.chargement = true
      try {
        const donnees = await authService.compte()
        this.utilisateur = donnees.utilisateur
        this.perimetre = donnees.perimetre
        return donnees
      } catch (e) {
        // Jeton révoqué ou invalide : on repart de zéro.
        this.nettoyer()
        throw e
      } finally {
        this.chargement = false
      }
    },

    /**
     * Déconnexion : on prévient le serveur (révocation du jeton),
     * puis on vide l'état local même si l'appel échoue.
     */
    async logout() {
      try {
        if (this.jeton && !(MODE_DEMO && this.jeton === JETON_DEMO)) await authService.deconnexion()
      } catch {
        // Jeton déjà invalide côté serveur : on ignore, on nettoie quand même.
      } finally {
        this.nettoyer()
      }
    },

    /** Vide l'état et le stockage local (utilisé par logout et par les 401). */
    nettoyer() {
      this.jeton = null
      this.utilisateur = null
      this.perimetre = null
      this.erreur = null
      localStorage.removeItem(CLE_JETON)
    },
  },
})
