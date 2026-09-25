// src/services/utilisateurs.service.js
// Domaine « Utilisateurs » : comptes et rôles. admin_national gère tout ;
// admin_academie gère uniquement les agents CAP et directeurs de son académie.
// Aucune suppression physique : désactivation (révoque aussi les jetons).
import api, { extraireDonnees, extraireListe, nettoyerParams } from './api.js'

export default {
  /** GET /utilisateurs — params : role, academie_id, cap_id, etablissement_id, actif, page, par_page, recherche, tri, ordre */
  async lister(params = {}) {
    const reponse = await api.get('/utilisateurs', { params: nettoyerParams(params) })
    return extraireListe(reponse)
  },

  /** GET /utilisateurs/{id} */
  async detail(id) {
    const reponse = await api.get(`/utilisateurs/${id}`)
    return extraireDonnees(reponse)
  },

  /**
   * POST /utilisateurs — body UtilisateurEntree : { nom*, prenom*, email*, mot_de_passe*, role*,
   * academie_id (admin_academie), cap_id (agent_cap), etablissement_id (directeur), actif }
   */
  async creer(donnees) {
    const reponse = await api.post('/utilisateurs', donnees)
    return extraireDonnees(reponse)
  },

  /** PUT /utilisateurs/{id} — mot_de_passe facultatif */
  async modifier(id, donnees) {
    const reponse = await api.put(`/utilisateurs/${id}`, donnees)
    return extraireDonnees(reponse)
  },

  /** POST /utilisateurs/{id}/activer */
  async activer(id) {
    const reponse = await api.post(`/utilisateurs/${id}/activer`)
    return extraireDonnees(reponse)
  },

  /** POST /utilisateurs/{id}/desactiver — révoque tous ses jetons */
  async desactiver(id) {
    const reponse = await api.post(`/utilisateurs/${id}/desactiver`)
    return extraireDonnees(reponse)
  },
}
