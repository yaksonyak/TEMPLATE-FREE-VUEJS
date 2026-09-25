// src/services/eleves.service.js
// Domaine « Élèves » : création avec première inscription (génère le matricule),
// fiche avec historique, modification de l'état civil, réinscription, recherche nationale.
import api, { extraireDonnees, extraireListe, nettoyerParams } from './api.js'

export default {
  /**
   * GET /eleves — params : etablissement_id, cap_id, academie_id, niveau, sexe, statut,
   * annee_scolaire_id, page, par_page, recherche (matricule/nom/prenom), tri, ordre.
   * 403 pour le rôle consultation. Chaque élève inclut `inscription_active`.
   */
  async lister(params = {}) {
    const reponse = await api.get('/eleves', { params: nettoyerParams(params) })
    return extraireListe(reponse)
  },

  /** GET /eleves/{id} — fiche complète : inscriptions[] et candidatures[] */
  async detail(id) {
    const reponse = await api.get(`/eleves/${id}`)
    return extraireDonnees(reponse)
  },

  /**
   * POST /eleves — RG-2/3/4 : crée l'élève + première inscription sur l'année active.
   * Body : état civil (prenom*, nom*, sexe*, date_naissance*, lieu_naissance*, …)
   *        + etablissement_id*, niveau*, serie_id, filiere_id, date_inscription.
   * Réponse : l'élève (avec matricule généré) + `avertissements[]` non bloquants.
   */
  async creer(donnees) {
    const reponse = await api.post('/eleves', donnees)
    return extraireDonnees(reponse)
  },

  /** PUT /eleves/{id} — état civil + statut ; le matricule n'est jamais modifiable */
  async modifier(id, donnees) {
    const reponse = await api.put(`/eleves/${id}`, donnees)
    return extraireDonnees(reponse)
  },

  /**
   * POST /eleves/{id}/reinscription — body : { niveau*, statut* (admis|redoublant),
   * etablissement_id?, serie_id?, filiere_id?, date_inscription? }
   * Réponse : { inscription, eleve, avertissements[] }
   */
  async reinscrire(id, donnees) {
    const reponse = await api.post(`/eleves/${id}/reinscription`, donnees)
    return extraireDonnees(reponse)
  },

  /** GET /eleves/recherche?matricule=… — recherche nationale exacte, hors périmètre. 404 si inconnu. */
  async rechercherParMatricule(matricule) {
    const reponse = await api.get('/eleves/recherche', { params: { matricule } })
    return extraireDonnees(reponse)
  },
}
