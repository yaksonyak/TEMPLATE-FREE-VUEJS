// src/services/auth.service.js
// Appels API du domaine « Authentification ». Un service ne fait QUE parler à l'API :
// il ne stocke rien et ne touche pas à l'interface. C'est le store auth qui l'utilise.
import api, { extraireDonnees } from './api.js'

export default {
  /**
   * POST /auth/connexion
   * @returns {Promise<{ jeton, type_jeton, utilisateur, perimetre }>}
   */
  async connexion(email, motDePasse) {
    const reponse = await api.post('/auth/connexion', {
      email,
      mot_de_passe: motDePasse,
      // Nom du jeton côté serveur (facultatif), placeholder dans .env
      appareil: import.meta.env.VITE_APP_DEVICE_NAME || 'navigateur-vue',
    })
    return extraireDonnees(reponse)
  },

  /**
   * GET /auth/compte — profil, rôle et périmètre de l'utilisateur connecté.
   * @returns {Promise<{ utilisateur, role, perimetre }>}
   */
  async compte() {
    const reponse = await api.get('/auth/compte')
    return extraireDonnees(reponse)
  },

  /** POST /auth/deconnexion — révoque le jeton courant côté serveur. */
  async deconnexion() {
    await api.post('/auth/deconnexion')
  },
}
