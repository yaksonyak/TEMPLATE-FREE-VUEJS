import api from './api.js'

const ENDPOINTS = {
  produits: import.meta.env.VITE_API_ENDPOINT_PRODUCTS || '/products',
  commandes: import.meta.env.VITE_API_ENDPOINT_ORDERS || '/orders',
  clients: import.meta.env.VITE_API_ENDPOINT_CUSTOMERS || '/customers',
}

function enveloppe(reponse) {
  return reponse.data?.donnees ?? reponse.data?.data ?? reponse.data
}

function normaliserListe(reponse, params = {}) {
  const donnees = enveloppe(reponse) || {}
  const elements = Array.isArray(donnees) ? donnees : donnees.elements || donnees.data || []
  const meta = donnees.pagination || donnees.meta || {}
  const page = Number(meta.page ?? meta.current_page ?? params.page) || 1
  const parPage = Number(meta.par_page ?? meta.per_page ?? params.par_page) || elements.length || 15
  const total = Number(meta.total ?? elements.length)
  const pagination = {
    page,
    par_page: parPage,
    total,
    total_pages: Number(meta.total_pages ?? meta.last_page) || Math.max(1, Math.ceil(total / parPage)),
  }
  return { elements, pagination }
}

function endpoint(ressource, id = '') {
  const base = ENDPOINTS[ressource]
  if (!base) throw new Error(`Ressource API non configurée : ${ressource}`)
  return `${base.replace(/\/$/, '')}${id === '' ? '' : `/${encodeURIComponent(id)}`}`
}

export default {
  async lister(ressource, params = {}) {
    const reponse = await api.get(endpoint(ressource), { params })
    return normaliserListe(reponse, params)
  },
  async creer(ressource, donnees) {
    const reponse = await api.post(endpoint(ressource), donnees)
    return enveloppe(reponse)
  },
  async modifier(ressource, id, donnees) {
    const reponse = await api.put(endpoint(ressource, id), donnees)
    return enveloppe(reponse)
  },
  async supprimer(ressource, id) {
    const reponse = await api.delete(endpoint(ressource, id))
    return enveloppe(reponse)
  },
}
