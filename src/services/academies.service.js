// src/services/academies.service.js
// Domaine « Académies » (AE). Lecture filtrée par le périmètre du rôle ;
// création / modification / suppression réservées à admin_national.
import api, { extraireDonnees, extraireListe, nettoyerParams } from './api.js'

export default {
  /** GET /academies — params : statut, page, par_page, recherche, tri (id|code|nom|statut|created_at), ordre */
  async lister(params = {}) {
    const reponse = await api.get('/academies', { params: nettoyerParams(params) })
    return extraireListe(reponse)
  },

  /** Toutes les académies actives pour un <select> (une seule page de 100). */
  async listerPourSelect() {
    const { elements } = await this.lister({ statut: 'actif', par_page: 100, tri: 'nom' })
    return elements
  },

  /** GET /academies/{id} — inclut caps, etablissements_directs, effectifs */
  async detail(id) {
    const reponse = await api.get(`/academies/${id}`)
    return extraireDonnees(reponse)
  },

  /** POST /academies — body AcademieEntree : { code*, nom*, adresse, telephone, email, directeur, statut } */
  async creer(donnees) {
    const reponse = await api.post('/academies', donnees)
    return extraireDonnees(reponse)
  },

  /** PUT /academies/{id} */
  async modifier(id, donnees) {
    const reponse = await api.put(`/academies/${id}`, donnees)
    return extraireDonnees(reponse)
  },

  /** DELETE /academies/{id} — RG-7 : désactivée si référencée, sinon supprimée */
  async supprimer(id) {
    const reponse = await api.delete(`/academies/${id}`)
    return reponse.data
  },
}
