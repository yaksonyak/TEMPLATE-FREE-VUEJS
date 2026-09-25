// src/utils/format.js
// Fonctions de formatage (nombres, dates) et libellés lisibles des énumérations
// exactes de l'API. Tout ce qui transforme une valeur brute en texte affichable est ici.

const formateurNombre = new Intl.NumberFormat('fr-FR')
const formateurDate = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const formateurDateHeure = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

/** 9186 → « 9 186 » */
export function formaterNombre(valeur) {
  if (valeur === null || valeur === undefined || valeur === '') return '—'
  return formateurNombre.format(Number(valeur))
}

/** « 2019-05-12 » → « 12/05/2019 » */
export function formaterDate(valeur) {
  if (!valeur) return '—'
  const date = new Date(valeur)
  return Number.isNaN(date.getTime()) ? String(valeur) : formateurDate.format(date)
}

/** ISO 8601 → « 12/05/2019 14:30 » */
export function formaterDateHeure(valeur) {
  if (!valeur) return '—'
  const date = new Date(valeur)
  return Number.isNaN(date.getTime()) ? String(valeur) : formateurDateHeure.format(date)
}

/** Date du jour au format attendu par l'API et par <input type="date"> : YYYY-MM-DD */
export function aujourdhuiISO() {
  return new Date().toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Libellés des énumérations de l'API (valeurs EXACTES en clé).
// ---------------------------------------------------------------------------
export const LIBELLES = {
  ordre: {
    fondamental: 'Fondamental',
    lycee: 'Lycée',
    technique_professionnel: 'Technique & professionnel',
  },
  statut_juridique: {
    public: 'Public',
    prive: 'Privé',
    communautaire: 'Communautaire',
    medersa: 'Médersa',
  },
  cycles: {
    premier: '1er cycle (1ère – 6ème)',
    second: '2nd cycle (7ème – 9ème)',
    les_deux: 'Les deux cycles',
  },
  examen: { DEF: 'DEF', BAC: 'BAC', CAP: 'CAP', BT: 'BT' },
  type_candidat: { regulier: 'Régulier', libre: 'Libre' },
  statut_inscription: {
    inscrit: 'Inscrit',
    admis: 'Admis',
    redoublant: 'Redoublant',
    transfere: 'Transféré',
    abandon: 'Abandon',
  },
  statut_validation: {
    en_attente: 'En attente',
    valide: 'Validé',
    rejete: 'Rejeté',
  },
  sexe: { M: 'Masculin', F: 'Féminin' },
  statut: { actif: 'Actif', inactif: 'Inactif' },
}

/**
 * Libellé d'une valeur d'énumération.
 * libelle('ordre', 'lycee') → « Lycée » ; valeur inconnue → renvoyée telle quelle.
 */
export function libelle(famille, valeur) {
  if (valeur === null || valeur === undefined || valeur === '') return '—'
  return LIBELLES[famille]?.[valeur] ?? String(valeur)
}

/**
 * Transforme une famille de libellés en options pour <AppSelect> :
 * optionsDepuis('examen') → [{ valeur: 'DEF', libelle: 'DEF' }, …]
 */
export function optionsDepuis(famille) {
  return Object.entries(LIBELLES[famille] || {}).map(([valeur, lib]) => ({ valeur, libelle: lib }))
}

/** « 9ème », « 1ère », « 10ème » à partir du numéro de niveau. */
export function libelleNiveau(niveau) {
  if (niveau === null || niveau === undefined) return '—'
  return Number(niveau) === 1 ? '1ère' : `${niveau}ème`
}
