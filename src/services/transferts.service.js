// src/services/transferts.service.js
// Domaine « Transferts » (RG-6) : demande entre deux établissements du même ordre,
// puis validation (crée l'inscription d'accueil, passe l'origine à `transfere`) ou rejet motivé.
import api, { extraireDonnees, extraireListe, nettoyerParams } from './api.js'

export default {
  /**
   * GET /transferts — params : statut, etablissement_id (origine OU accueil), etablissement_origine_id,
   * etablissement_accueil_id, annee_scolaire_id, eleve_id, page, par_page, recherche, tri, ordre.
   */
  async lister(params = {}) {
    const reponse = await api.get('/transferts', { params: nettoyerParams(params) })
    return extraireListe(reponse)
  },

  /** GET /transferts/{id} */
  async detail(id) {
    const reponse = await api.get(`/transferts/${id}`)
    return extraireDonnees(reponse)
  },

  /** POST /transferts — body : { eleve_id*, etablissement_origine_id*, etablissement_accueil_id*, motif* } */
  async demander(donnees) {
    const reponse = await api.post('/transferts', donnees)
    return extraireDonnees(reponse)
  },

  /** POST /transferts/{id}/valider — agent_cap (son CAP), admin_academie (son académie), admin_national */
  async valider(id) {
    const reponse = await api.post(`/transferts/${id}/valider`)
    return extraireDonnees(reponse)
  },

  /** POST /transferts/{id}/rejeter — body : { motif_rejet* } */
  async rejeter(id, motifRejet) {
    const reponse = await api.post(`/transferts/${id}/rejeter`, { motif_rejet: motifRejet })
    return extraireDonnees(reponse)
  },
}
