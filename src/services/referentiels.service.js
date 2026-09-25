// src/services/referentiels.service.js
// Domaine « Référentiels » de l'API : séries (lecture), filières (lecture),
// années scolaires (CRUD + activation, réservés à admin_national).
import api, { extraireDonnees, extraireListe, nettoyerParams } from './api.js'

export default {
  // ------------------------------------------------------------ SÉRIES (lycée)
  /** GET /series — params : page, par_page, recherche, tri (id|code|libelle), ordre */
  async listerSeries(params = {}) {
    const reponse = await api.get('/series', { params: nettoyerParams(params) })
    return extraireListe(reponse)
  },

  // ------------------------------------------------------------ FILIÈRES (technique)
  /** GET /filieres — params : diplome (CAP|BT), page, par_page, recherche, tri, ordre */
  async listerFilieres(params = {}) {
    const reponse = await api.get('/filieres', { params: nettoyerParams(params) })
    return extraireListe(reponse)
  },

  // ------------------------------------------------------------ ANNÉES SCOLAIRES
  /** GET /annees-scolaires — params : active (true|false), page, par_page, recherche, tri, ordre */
  async listerAnneesScolaires(params = {}) {
    const reponse = await api.get('/annees-scolaires', { params: nettoyerParams(params) })
    return extraireListe(reponse)
  },

  /** GET /annees-scolaires/{id} */
  async detailAnneeScolaire(id) {
    const reponse = await api.get(`/annees-scolaires/${id}`)
    return extraireDonnees(reponse)
  },

  /** POST /annees-scolaires — body : { libelle, active? } */
  async creerAnneeScolaire(donnees) {
    const reponse = await api.post('/annees-scolaires', donnees)
    return extraireDonnees(reponse)
  },

  /** PUT /annees-scolaires/{id} — body : { libelle, active? } */
  async modifierAnneeScolaire(id, donnees) {
    const reponse = await api.put(`/annees-scolaires/${id}`, donnees)
    return extraireDonnees(reponse)
  },

  /** DELETE /annees-scolaires/{id} — 409 si active ou référencée */
  async supprimerAnneeScolaire(id) {
    const reponse = await api.delete(`/annees-scolaires/${id}`)
    return reponse.data
  },

  /** POST /annees-scolaires/{id}/activer — RG-9 : désactive toutes les autres */
  async activerAnneeScolaire(id) {
    const reponse = await api.post(`/annees-scolaires/${id}/activer`)
    return extraireDonnees(reponse)
  },
}
