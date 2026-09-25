// src/utils/permissions.js
// Traduction en JavaScript de la matrice des rôles (RG-8 de l'API).
// Tout ce qui concerne « qui a le droit de voir / faire quoi » est ici,
// pour que les pages, la sidebar et le router utilisent la même source de vérité.

/** Les 5 rôles exacts renvoyés par l'API (champ `role`). */
export const ROLES = {
  ADMIN_NATIONAL: 'admin_national',
  ADMIN_ACADEMIE: 'admin_academie',
  AGENT_CAP: 'agent_cap',
  DIRECTEUR: 'directeur_etablissement',
  CONSULTATION: 'consultation',
}

/** Libellés lisibles pour l'affichage (en-tête, page Rôles, badges). */
export const LIBELLES_ROLES = {
  admin_national: 'Administrateur national',
  admin_academie: "Administrateur d'académie",
  agent_cap: 'Agent CAP',
  directeur_etablissement: "Directeur d'établissement",
  consultation: 'Consultation',
}

/** Tous les rôles connectés. */
export const TOUS_LES_ROLES = Object.values(ROLES)

/** Rôles « de gestion » : accès aux données nominatives (élèves, transferts, candidats). */
export const ROLES_GESTION = [
  ROLES.ADMIN_NATIONAL,
  ROLES.ADMIN_ACADEMIE,
  ROLES.AGENT_CAP,
  ROLES.DIRECTEUR,
]

/**
 * Matrice des droits d'ÉCRITURE par ressource, déduite de la doc API.
 * Clé = nom de la ressource, valeur = rôles autorisés à créer / modifier.
 * La lecture est gérée par les routes (meta.roles), pas ici.
 */
export const DROITS_ECRITURE = {
  academies: [ROLES.ADMIN_NATIONAL],
  caps: [ROLES.ADMIN_NATIONAL, ROLES.ADMIN_ACADEMIE],
  etablissements: [ROLES.ADMIN_NATIONAL, ROLES.ADMIN_ACADEMIE, ROLES.AGENT_CAP],
  annees_scolaires: [ROLES.ADMIN_NATIONAL],
  eleves: ROLES_GESTION,
  transferts: ROLES_GESTION,          // demander un transfert
  candidats: ROLES_GESTION,           // déposer une candidature
  utilisateurs: [ROLES.ADMIN_NATIONAL, ROLES.ADMIN_ACADEMIE],
}

/** Rôles autorisés à VALIDER / REJETER (transferts et candidatures). */
export const DROITS_VALIDATION = {
  transferts: [ROLES.ADMIN_NATIONAL, ROLES.ADMIN_ACADEMIE, ROLES.AGENT_CAP],
  candidats: [ROLES.ADMIN_NATIONAL, ROLES.ADMIN_ACADEMIE, ROLES.AGENT_CAP],
}

/**
 * L'utilisateur avec ce rôle peut-il voir cette route ?
 * Une route sans `meta.roles` est visible par tous les rôles connectés.
 * @param {import('vue-router').RouteLocationNormalized | { meta: object }} route
 * @param {string} role
 */
export function canSee(route, role) {
  const rolesAutorises = route?.meta?.roles
  if (!rolesAutorises || rolesAutorises.length === 0) return true
  return rolesAutorises.includes(role)
}

/**
 * L'utilisateur avec ce rôle peut-il créer / modifier cette ressource ?
 * Exemple : canEdit('eleves', 'directeur_etablissement') → true
 * @param {keyof typeof DROITS_ECRITURE} ressource
 * @param {string} role
 */
export function canEdit(ressource, role) {
  const rolesAutorises = DROITS_ECRITURE[ressource]
  if (!rolesAutorises) return false
  return rolesAutorises.includes(role)
}

/**
 * L'utilisateur avec ce rôle peut-il valider / rejeter cette ressource ?
 * @param {'transferts' | 'candidats'} ressource
 * @param {string} role
 */
export function canValidate(ressource, role) {
  const rolesAutorises = DROITS_VALIDATION[ressource]
  if (!rolesAutorises) return false
  return rolesAutorises.includes(role)
}

/** Libellé lisible d'un rôle, avec repli sur la valeur brute. */
export function libelleRole(role) {
  return LIBELLES_ROLES[role] || role || '—'
}
