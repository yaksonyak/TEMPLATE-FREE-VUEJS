<!-- src/components/charts/EffectifsPanel.vue
     Affiche un objet `effectifs` renvoyé par l'API (détail académie, CAP ou établissement,
     et bloc `effectifs` des statistiques). Les clés présentes varient selon le niveau :
       - eleves / total, etablissements, par_ordre, par_genre, par_niveau, par_serie,
         par_filiere, par_statut_juridique.
     Le composant n'affiche que ce qui existe. -->
<template>
  <div v-if="effectifs" class="space-y-5">
    <p v-if="effectifs.annee_scolaire" class="text-xs text-slate-500">
      Année scolaire : <span class="font-medium text-slate-700">{{ libelleAnnee }}</span>
    </p>

    <!-- Tuiles -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard libelle="Élèves" :valeur="totalEleves" />
      <StatCard v-if="effectifs.etablissements !== undefined" libelle="Établissements" :valeur="effectifs.etablissements" couleur="bleu" />
      <StatCard v-if="effectifs.par_genre" libelle="Filles" :valeur="effectifs.par_genre.F ?? 0" couleur="ambre" :sous-texte="pourcentage(effectifs.par_genre.F)" />
      <StatCard v-if="effectifs.par_genre" libelle="Garçons" :valeur="effectifs.par_genre.M ?? 0" couleur="gris" :sous-texte="pourcentage(effectifs.par_genre.M)" />
    </div>

    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-slate-700">Répartitions</p>
        <p class="text-xs text-slate-500">Choisissez la catégorie à afficher.</p>
      </div>
      <AppSelect v-model="graphiqueSelectionne" label="Filtrer les graphes" :options="optionsGraphiques" />
    </div>

    <div class="grid grid-cols-1 gap-5">
      <BarChart
        v-for="graphique in graphiquesVisibles"
        :key="graphique.cle"
        :titre="graphique.titre"
        :donnees="graphique.donnees"
        :couleurs="graphique.couleurs"
        :couleur="graphique.couleur"
        vertical
      />
    </div>
  </div>
  <p v-else class="text-sm text-slate-500">Aucun effectif disponible.</p>
</template>

<script>
import StatCard from './StatCard.vue'
import BarChart from './BarChart.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import { libelle, libelleNiveau } from '@/utils/format.js'

/** { a: 3, b: 5 } → [{ libelle, valeur, cle }] avec libellés traduits si une famille est donnée. */
function objetVersListe(objet, famille = null) {
  if (!objet) return []
  return Object.entries(objet).map(([cle, valeur]) => ({
    libelle: famille ? libelle(famille, cle) : cle,
    valeur: Number(valeur) || 0,
    cle,
  }))
}

/** Couleurs par clé API pour les ordres d'enseignement. */
const COULEURS_ORDRE = {
  fondamental:             '#3B82F6', // bleu
  lycee:                   '#F59E0B', // orange/ambre
  technique_professionnel: '#8B5CF6', // violet
}

/** Couleurs par clé API pour les statuts juridiques. */
const COULEURS_STATUT_JURIDIQUE = {
  public:        '#10B981', // vert émeraude
  prive:         '#3B82F6', // bleu
  communautaire: '#F59E0B', // orange/ambre
  medersa:       '#8B5CF6', // violet
}

/** Couleurs par ordre pour le graphe "par niveau". */
const COULEURS_NIVEAU_ORDRE = {
  fondamental:             '#3B82F6', // bleu
  lycee:                   '#10B981', // vert
  technique_professionnel: '#F59E0B', // orange
}

const PALETTE_CATEGORIES = ['#2563EB', '#059669', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#65A30D', '#EA580C']

export default {
  name: 'EffectifsPanel',
  components: { StatCard, BarChart, AppSelect },
  props: {
    effectifs: { type: Object, default: null },
  },
  data() {
    return { graphiqueSelectionne: 'tous' }
  },
  computed: {
    optionsGraphiques() {
      return [
        { valeur: 'tous', libelle: 'Toutes les répartitions' },
        { valeur: 'ordre', libelle: "Ordre d'enseignement" },
        { valeur: 'statut', libelle: 'Statut juridique' },
        { valeur: 'niveau', libelle: 'Niveau' },
        { valeur: 'serie', libelle: 'Série' },
        { valeur: 'filiere', libelle: 'Filière' },
      ]
    },
    libelleAnnee() {
      const a = this.effectifs.annee_scolaire
      return typeof a === 'object' ? a?.libelle : a
    },
    totalEleves() {
      return this.effectifs.eleves ?? this.effectifs.total ?? 0
    },
    parOrdre() {
      return objetVersListe(this.effectifs.par_ordre, 'ordre')
    },
    /** Couleurs correspondant à chaque barre de parOrdre (même index). */
    couleursOrdre() {
      return this.parOrdre.map((item) => COULEURS_ORDRE[item.cle] || '#64748B')
    },
    parStatutJuridique() {
      return objetVersListe(this.effectifs.par_statut_juridique, 'statut_juridique')
    },
    /** Couleurs correspondant à chaque barre de parStatutJuridique. */
    couleursStatutJuridique() {
      return this.parStatutJuridique.map((item) => COULEURS_STATUT_JURIDIQUE[item.cle] || '#64748B')
    },
    parNiveau() {
      const n = this.effectifs.par_niveau
      if (!n) return []
      // Établissement : [{ niveau, total }] ; statistiques : { fondamental: [...], lycee: [...] }
      if (Array.isArray(n)) return n.map((x) => ({ libelle: libelleNiveau(x.niveau), valeur: x.total }))
      return Object.entries(n).flatMap(([ordre, liste]) =>
        (liste || []).map((x) => ({ libelle: `${libelle('ordre', ordre)} · ${libelleNiveau(x.niveau)}`, valeur: x.total, ordreKey: ordre }))
      )
    },
    /** Couleurs correspondant à chaque barre de parNiveau (par ordre d'appartenance). */
    couleursNiveau() {
      return this.parNiveau.map((item, index) => item.ordreKey ? COULEURS_NIVEAU_ORDRE[item.ordreKey] || PALETTE_CATEGORIES[index % PALETTE_CATEGORIES.length] : PALETTE_CATEGORIES[index % PALETTE_CATEGORIES.length])
    },
    parSerie() {
      return objetVersListe(this.effectifs.par_serie)
    },
    parFiliere() {
      return objetVersListe(this.effectifs.par_filiere)
    },
    couleursSerie() {
      return this.parSerie.map((_, index) => PALETTE_CATEGORIES[index % PALETTE_CATEGORIES.length])
    },
    couleursFiliere() {
      return this.parFiliere.map((_, index) => PALETTE_CATEGORIES[index % PALETTE_CATEGORIES.length])
    },
    graphiques() {
      return [
        { cle: 'ordre', titre: "Par ordre d'enseignement", donnees: this.parOrdre, couleurs: this.couleursOrdre },
        { cle: 'statut', titre: 'Par statut juridique', donnees: this.parStatutJuridique, couleurs: this.couleursStatutJuridique },
        { cle: 'niveau', titre: 'Par niveau', donnees: this.parNiveau, couleurs: this.couleursNiveau },
        { cle: 'serie', titre: 'Par série', donnees: this.parSerie, couleurs: this.couleursSerie },
        { cle: 'filiere', titre: 'Par filière', donnees: this.parFiliere, couleurs: this.couleursFiliere },
      ]
    },
    graphiquesVisibles() {
      return this.graphiques.filter((graphique) => {
        if (!graphique.donnees.length) return false
        return this.graphiqueSelectionne === 'tous' || graphique.cle === this.graphiqueSelectionne
      })
    },
  },
  methods: {
    pourcentage(valeur) {
      if (!this.totalEleves || valeur === undefined) return ''
      return `${Math.round((Number(valeur) / this.totalEleves) * 100)} %`
    },
  },
}
</script>

