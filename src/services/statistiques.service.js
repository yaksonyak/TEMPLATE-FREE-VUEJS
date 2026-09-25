// src/services/statistiques.service.js
// Domaine « Statistiques » : agrégats sur l'année active, à 4 niveaux.
// Réponse : { niveau, annee_scolaire, effectifs, candidats, transferts, academie? | cap? | etablissement? }
import api, { extraireDonnees } from './api.js'

export default {
  /** GET /statistiques/national — admin_national et consultation */
  async national() {
    const reponse = await api.get('/statistiques/national')
    return extraireDonnees(reponse)
  },
  /** GET /statistiques/academies/{id} */
  async academie(id) {
    const reponse = await api.get(`/statistiques/academies/${id}`)
    return extraireDonnees(reponse)
  },
  /** GET /statistiques/caps/{id} */
  async cap(id) {
    const reponse = await api.get(`/statistiques/caps/${id}`)
    return extraireDonnees(reponse)
  },
  /** GET /statistiques/etablissements/{id} */
  async etablissement(id) {
    const reponse = await api.get(`/statistiques/etablissements/${id}`)
    return extraireDonnees(reponse)
  },

  /**
   * Statistiques « de mon périmètre » : choisit l'endpoint selon perimetre.niveau
   * (objet renvoyé à la connexion). Le rôle consultation voit le niveau national.
   */
  pourPerimetre(perimetre) {
    switch (perimetre?.niveau) {
      case 'academie':
        return this.academie(perimetre.academie.id)
      case 'cap':
        return this.cap(perimetre.cap.id)
      case 'etablissement':
        return this.etablissement(perimetre.etablissement.id)
      default:
        return this.national()
    }
  },
}
