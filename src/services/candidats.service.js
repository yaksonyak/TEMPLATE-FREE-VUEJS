// src/services/candidats.service.js
// Domaine « Candidats » (RG-5) : candidatures aux examens nationaux DEF, BAC, CAP, BT,
// régulières (élève inscrit) ou libres (dépôt au CAP pour le DEF, à l'académie sinon).
import api, { extraireDonnees, extraireListe, nettoyerParams } from './api.js'

export default {
  /**
   * GET /candidats — params : examen, type_candidat, annee_scolaire_id, serie_id, filiere_id,
   * etablissement_id, cap_id, academie_id, statut, page, par_page, recherche, tri, ordre.
   */
  async lister(params = {}) {
    const reponse = await api.get('/candidats', { params: nettoyerParams(params) })
    return extraireListe(reponse)
  },

  /** GET /candidats/{id} */
  async detail(id) {
    const reponse = await api.get(`/candidats/${id}`)
    return extraireDonnees(reponse)
  },

  /**
   * POST /candidats — body CandidatEntree :
   *  { examen*, type_candidat*, eleve_id | matricule | eleve{état civil}, etablissement_id (régulier),
   *    cap_id (libre DEF), academie_id (libre BAC/CAP/BT), serie_id (BAC), filiere_id (CAP/BT), pieces_jointes[] }
   *  409 si l'élève a déjà une candidature à cet examen pour la session.
   */
  async deposer(donnees) {
    const reponse = await api.post('/candidats', donnees)
    return extraireDonnees(reponse)
  },

  /** POST /candidats/{id}/valider */
  async valider(id) {
    const reponse = await api.post(`/candidats/${id}/valider`)
    return extraireDonnees(reponse)
  },

  /** POST /candidats/{id}/rejeter — body : { motif_rejet* } */
  async rejeter(id, motifRejet) {
    const reponse = await api.post(`/candidats/${id}/rejeter`, { motif_rejet: motifRejet })
    return extraireDonnees(reponse)
  },
}
