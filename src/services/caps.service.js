// src/services/caps.service.js
// Domaine « CAP » (Centres d'Animation Pédagogique) : structure administrative
// des écoles fondamentales, rattachée à une académie.
import api, { extraireDonnees, extraireListe, nettoyerParams } from './api.js'

export default {
  /** GET /caps — params : academie_id, statut, page, par_page, recherche, tri, ordre */
  async lister(params = {}) {
    const reponse = await api.get('/caps', { params: nettoyerParams(params) })
    return extraireListe(reponse)
  },

  /** CAP actifs d'une académie (ou tous) pour un <select>. */
  async listerPourSelect(academieId = null) {
    const { elements } = await this.lister({ academie_id: academieId, statut: 'actif', par_page: 100, tri: 'nom' })
    return elements
  },

  /** GET /caps/{id} — inclut etablissements (avec nb_eleves) et effectifs */
  async detail(id) {
    const reponse = await api.get(`/caps/${id}`)
    return extraireDonnees(reponse)
  },

  /** POST /caps — body CapEntree : { code*, nom*, academie_id*, adresse, telephone, directeur, statut } */
  async creer(donnees) {
    const reponse = await api.post('/caps', donnees)
    return extraireDonnees(reponse)
  },

  /** PUT /caps/{id} */
  async modifier(id, donnees) {
    const reponse = await api.put(`/caps/${id}`, donnees)
    return extraireDonnees(reponse)
  },

  /** DELETE /caps/{id} — RG-7 */
  async supprimer(id) {
    const reponse = await api.delete(`/caps/${id}`)
    return reponse.data
  },
}
