// src/services/etablissements.service.js
// Domaine « Établissements » : écoles fondamentales (rattachées à un CAP),
// lycées et établissements techniques (rattachés directement à une académie).
import api, { extraireDonnees, extraireListe, nettoyerParams } from './api.js'

export default {
  /**
   * GET /etablissements — params : academie_id, cap_id, ordre_enseignement, statut_juridique, cycle,
   * serie_id, filiere_id, statut, page, par_page, recherche, tri, ordre.
   *
   * ⚠️ Ambiguïté de la spec : sur cet endpoint, le paramètre `ordre` désigne À LA FOIS le filtre
   * « ordre d'enseignement » (fondamental|lycee|technique_professionnel) et le sens du tri (asc|desc).
   * Côté front on nomme le filtre `ordre_enseignement` et on donne la priorité au filtre métier :
   * quand il est actif, le sens de tri n'est pas envoyé. Le sens de tri n'est envoyé que si un tri
   * est réellement demandé (`tri` non vide) : sinon la valeur par défaut « asc » atterrirait dans
   * `ordre` et serait comprise par le serveur comme un filtre « ordre d'enseignement = asc »,
   * qui ne correspond à rien → liste vide au premier chargement.
   * Point à clarifier avec l'équipe back (renommer le filtre en `ordre_enseignement` côté API).
   */
  async lister(params = {}) {
    const { ordre_enseignement, ordre, tri, ...reste } = params
    const query = nettoyerParams({ ...reste, tri })
    if (ordre_enseignement) query.ordre = ordre_enseignement
    else if (tri && ordre) query.ordre = ordre
    const reponse = await api.get('/etablissements', { params: query })
    return extraireListe(reponse)
  },

  /** Établissements actifs pour un <select>, filtrables (ex. { cap_id: 3 } ou { ordre_enseignement: 'lycee' }). */
  async listerPourSelect(filtres = {}) {
    const { elements } = await this.lister({ ...filtres, statut: 'actif', par_page: 100, tri: 'nom' })
    return elements
  },

  /** GET /etablissements/{id} — inclut series, filieres, effectifs */
  async detail(id) {
    const reponse = await api.get(`/etablissements/${id}`)
    return extraireDonnees(reponse)
  },

  /**
   * POST /etablissements — body EtablissementEntree (RG-1) :
   * { code*, nom*, ordre*, statut_juridique*, cap_id, academie_id, cycles, localite, telephone,
   *   directeur, nb_salles, statut, series[], filieres[] }
   */
  async creer(donnees) {
    const reponse = await api.post('/etablissements', donnees)
    return extraireDonnees(reponse)
  },

  /** PUT /etablissements/{id} */
  async modifier(id, donnees) {
    const reponse = await api.put(`/etablissements/${id}`, donnees)
    return extraireDonnees(reponse)
  },

  /** DELETE /etablissements/{id} — RG-7 */
  async supprimer(id) {
    const reponse = await api.delete(`/etablissements/${id}`)
    return reponse.data
  },
}
