// src/mixins/listeApi.js
// MIXIN : un morceau de composant (data + methods + watch) que l'on « mélange »
// dans une page. Il factorise tout ce qu'une page de liste paginée répète :
// charger, trier, paginer, rechercher, gérer chargement / erreur / vide.
//
// La page qui l'utilise doit fournir UNE méthode :
//   chargerElements(params)  → appelle le service et renvoie { elements, pagination }
// et peut définir :
//   filtresInitiaux()        → objet des filtres propres à la page (ex. { statut: '' })
import { nettoyerParams } from '@/services/api.js'

export default {
  data() {
    return {
      elements: [],
      pagination: { page: 1, par_page: 15, total: 0, total_pages: 1 },
      chargement: false,
      erreur: '',
      // Paramètres envoyés à l'API (communs + filtres propres à la page)
      params: {
        page: 1,
        par_page: 15,
        tri: '',
        ordre: 'asc',
        recherche: '',
        ...(this.filtresInitiaux ? this.filtresInitiaux() : {}),
      },
      minuteurRecherche: null,
    }
  },

  // Premier chargement dès la création de la page
  created() {
    this.charger()
  },

  watch: {
    // Recherche « au fil de la frappe » avec un délai de 400 ms (debounce)
    // pour ne pas appeler l'API à chaque lettre.
    'params.recherche'() {
      clearTimeout(this.minuteurRecherche)
      this.minuteurRecherche = setTimeout(() => {
        this.params.page = 1
        this.charger()
      }, 400)
    },
  },

  methods: {
    async charger() {
      this.chargement = true
      this.erreur = ''
      try {
        const { elements, pagination } = await this.chargerElements(nettoyerParams(this.params))
        this.elements = elements
        this.pagination = pagination
      } catch (e) {
        this.erreur = e.message
        this.elements = []
      } finally {
        this.chargement = false
      }
    },

    /** Reçu de <AppTable @trier> */
    trier({ tri, ordre }) {
      this.params.tri = tri
      this.params.ordre = ordre
      this.params.page = 1
      this.charger()
    },

    /** Reçu de <AppPagination @changer-page> */
    changerPage(page) {
      this.params.page = page
      this.charger()
    },

    /** Reçu de <AppPagination @changer-taille> */
    changerTaille(taille) {
      this.params.par_page = taille
      this.params.page = 1
      this.charger()
    },

    /** À appeler quand un filtre (select) change. */
    filtrer() {
      this.params.page = 1
      this.charger()
    },

    /** Remet recherche et filtres propres à zéro. */
    reinitialiser() {
      const filtres = this.filtresInitiaux ? this.filtresInitiaux() : {}
      Object.assign(this.params, { page: 1, recherche: '', ...filtres })
      this.charger()
    },
  },
}
