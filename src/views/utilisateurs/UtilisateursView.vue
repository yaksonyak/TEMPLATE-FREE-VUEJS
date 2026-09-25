<!-- src/views/utilisateurs/UtilisateursView.vue
     Objectif : gérer les comptes du portail et leur rattachement (académie, CAP ou établissement selon le rôle).
     Endpoints : GET /utilisateurs, POST /utilisateurs, PUT /utilisateurs/{id}, POST …/activer, POST …/desactiver.
     Permissions : route admin_national + admin_academie. L'administrateur d'académie ne crée que des agents CAP
     et des directeurs de son académie (les autres rôles sont retirés du formulaire). Aucune suppression :
     la désactivation révoque les jetons du compte (RG-7). -->
<template>
  <div class="space-y-4">
    <AppAlert v-if="succes" type="succes" :message="succes" fermable @fermer="succes = ''" />
    <AppAlert v-if="erreurAction" type="erreur" :message="erreurAction" fermable @fermer="erreurAction = ''" />

    <AppCard titre="Utilisateurs" :sous-titre="`${pagination.total} compte(s)`" sans-marge>
      <template #actions>
        <select v-model="params.role" aria-label="Rôle" class="champ-filtre" @change="filtrer">
          <option value="">Tous les rôles</option>
          <option v-for="r in rolesAutorises" :key="r" :value="r">{{ libelleRole(r) }}</option>
        </select>
        <select v-model="params.actif" aria-label="État" class="champ-filtre" @change="filtrer">
          <option value="">Actifs et inactifs</option>
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
        </select>
        <input v-model="params.recherche" type="search" placeholder="Nom, prénom, e-mail…" aria-label="Rechercher" class="champ-filtre w-52" />
        <AppButton taille="sm" @click="ouvrirCreation">+ Nouvel utilisateur</AppButton>
      </template>

      <AppTable :colonnes="colonnes" :lignes="elements" :chargement="chargement" :erreur="erreur"
                :tri="params.tri" :ordre="params.ordre" message-vide="Aucun utilisateur." @trier="trier" @reessayer="charger">
        <template #cellule-nom="{ ligne }">
          <p class="font-medium text-slate-800">{{ ligne.nom }} {{ ligne.prenom }}</p>
          <p class="text-xs text-slate-500">{{ ligne.email }}</p>
        </template>
        <template #cellule-role="{ valeur }"><AppBadge :valeur="libelleRole(valeur)" :couleur="valeur === 'admin_national' ? 'rouge' : valeur === 'consultation' ? 'gris' : 'vert'" /></template>
        <template #cellule-rattachement="{ ligne }">
          <span class="text-sm">{{ ligne.etablissement?.nom || ligne.cap?.nom || ligne.academie?.nom || (ligne.role === 'admin_national' ? 'Tout le territoire' : '—') }}</span>
        </template>
        <template #cellule-actif="{ valeur }"><AppBadge :valeur="valeur" /></template>
        <template #actions="{ ligne }">
          <div class="inline-flex gap-1">
            <AppButton variante="outline" taille="sm" @click="ouvrirModification(ligne)">Modifier</AppButton>
            <AppButton v-if="ligne.actif" variante="danger" taille="sm" :disabled="ligne.id === moi?.id" @click="confirmation = { cible: ligne, action: 'desactiver', chargement: false }">Désactiver</AppButton>
            <AppButton v-else variante="success" taille="sm" @click="confirmation = { cible: ligne, action: 'activer', chargement: false }">Activer</AppButton>
          </div>
        </template>
      </AppTable>

      <template #pied>
        <AppPagination :pagination="pagination" @changer-page="changerPage" @changer-taille="changerTaille" />
      </template>
    </AppCard>

    <!-- ===================== Formulaire ===================== -->
    <AppModal :ouvert="formulaire.ouvert" :titre="formulaire.id ? 'Modifier l’utilisateur' : 'Nouvel utilisateur'" taille="lg" @fermer="formulaire.ouvert = false">
      <form id="form-user" class="space-y-4" @submit.prevent="enregistrer">
        <AppAlert v-if="formulaire.erreur" type="erreur" :message="formulaire.erreur" />
        <div class="grid sm:grid-cols-2 gap-4">
          <AppInput v-model="formulaire.donnees.nom" label="Nom" obligatoire :erreur="formulaire.erreurs.nom" />
          <AppInput v-model="formulaire.donnees.prenom" label="Prénom" obligatoire :erreur="formulaire.erreurs.prenom" />
          <AppInput v-model="formulaire.donnees.email" label="E-mail (identifiant de connexion)" type="email" obligatoire autocomplete="off" :erreur="formulaire.erreurs.email" />
          <AppInput v-model="formulaire.donnees.mot_de_passe" label="Mot de passe" type="password" :obligatoire="!formulaire.id" autocomplete="new-password"
                    :aide="formulaire.id ? 'Laisser vide pour ne pas le changer' : '8 caractères minimum conseillés'" :erreur="formulaire.erreurs.mot_de_passe" />
          <AppSelect v-model="formulaire.donnees.role" label="Rôle" :options="optionsRoles" obligatoire :erreur="formulaire.erreurs.role" @update:model-value="changerRole" />
          <AppSelect v-if="formulaire.id" v-model="formulaire.donnees.actif" label="État du compte" :options="[{ valeur: 'true', libelle: 'Actif' }, { valeur: 'false', libelle: 'Inactif' }]" />
        </div>

        <!-- Rattachement selon le rôle -->
        <div v-if="formulaire.donnees.role === 'admin_academie'" class="grid sm:grid-cols-2 gap-4">
          <AppSelect v-model="formulaire.donnees.academie_id" label="Académie" :options="academies" cle-valeur="id" cle-libelle="nom" numerique obligatoire :chargement="chargementListes" :erreur="formulaire.erreurs.academie_id" />
        </div>
        <div v-else-if="formulaire.donnees.role === 'agent_cap'" class="grid sm:grid-cols-2 gap-4">
          <AppSelect v-if="estNational" v-model="formulaire.academie_temp" label="Académie" :options="academies" cle-valeur="id" cle-libelle="nom" numerique :chargement="chargementListes" @update:model-value="chargerCaps" />
          <AppSelect v-model="formulaire.donnees.cap_id" label="CAP" :options="caps" cle-valeur="id" cle-libelle="nom" numerique obligatoire :chargement="chargementListes" :erreur="formulaire.erreurs.cap_id" />
        </div>
        <EtablissementPicker v-else-if="formulaire.donnees.role === 'directeur_etablissement'" v-model="formulaire.donnees.etablissement_id" label="Établissement dirigé" obligatoire
                             :erreur="formulaire.erreurs.etablissement_id" />
        <p v-else-if="formulaire.donnees.role" class="text-xs text-slate-500">Ce rôle n'a pas de rattachement : {{ formulaire.donnees.role === 'admin_national' ? 'tout le territoire.' : 'lecture des statistiques uniquement.' }}</p>
      </form>
      <template #pied>
        <AppButton variante="outline" :disabled="formulaire.chargement" @click="formulaire.ouvert = false">Annuler</AppButton>
        <AppButton type="submit" form="form-user" :chargement="formulaire.chargement">Enregistrer</AppButton>
      </template>
    </AppModal>

    <AppConfirmModal :ouvert="Boolean(confirmation.cible)" :titre="confirmation.action === 'activer' ? 'Activer le compte' : 'Désactiver le compte'"
      :message="confirmation.action === 'activer' ? `Réactiver le compte de ${confirmation.cible?.nom_complet} ?` : `Désactiver le compte de ${confirmation.cible?.nom_complet} ? Ses jetons de connexion seront révoqués immédiatement.`"
      :libelle-confirmer="confirmation.action === 'activer' ? 'Activer' : 'Désactiver'" :variante="confirmation.action === 'activer' ? 'success' : 'danger'"
      :chargement="confirmation.chargement" @fermer="confirmation = { cible: null, action: null, chargement: false }" @confirmer="basculerActivation" />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import listeApi from '@/mixins/listeApi.js'
import utilisateursService from '@/services/utilisateurs.service.js'
import academiesService from '@/services/academies.service.js'
import capsService from '@/services/caps.service.js'
import { useAuthStore } from '@/stores/auth.js'
import { ROLES, TOUS_LES_ROLES, libelleRole } from '@/utils/permissions.js'
import { formaterDateHeure } from '@/utils/format.js'

const FORMULAIRE_VIDE = () => ({ nom: '', prenom: '', email: '', mot_de_passe: '', role: '', academie_id: '', cap_id: '', etablissement_id: '', actif: 'true' })

export default {
  name: 'UtilisateursView',
  mixins: [listeApi],

  data() {
    return {
      colonnes: [
        { cle: 'nom', libelle: 'Utilisateur', triable: true },
        { cle: 'role', libelle: 'Rôle', triable: true, classe: 'w-48' },
        { cle: 'rattachement', libelle: 'Périmètre' },
        { cle: 'created_at', libelle: 'Créé le', triable: true, classe: 'w-36', format: (v, l) => formaterDateHeure(l.cree_le || v) },
        { cle: 'actif', libelle: 'État', triable: true, classe: 'w-24' },
      ],
      academies: [],
      caps: [],
      chargementListes: false,
      succes: '',
      erreurAction: '',
      formulaire: { ouvert: false, id: null, academie_temp: '', donnees: FORMULAIRE_VIDE(), chargement: false, erreur: '', erreurs: {} },
      confirmation: { cible: null, action: null, chargement: false },
    }
  },

  computed: {
    ...mapState(useAuthStore, { role: 'role', perimetre: 'perimetre', niveauPerimetre: 'niveauPerimetre', moi: 'utilisateur' }),
    estNational() {
      return this.niveauPerimetre === 'national'
    },
    /** admin_academie : seulement agents CAP et directeurs. */
    rolesAutorises() {
      return this.role === ROLES.ADMIN_NATIONAL ? TOUS_LES_ROLES : [ROLES.AGENT_CAP, ROLES.DIRECTEUR]
    },
    optionsRoles() {
      return this.rolesAutorises.map((r) => ({ valeur: r, libelle: libelleRole(r) }))
    },
  },

  async created() {
    this.chargementListes = true
    try {
      if (this.estNational) this.academies = await academiesService.listerPourSelect()
      else {
        this.academies = this.perimetre?.academie ? [this.perimetre.academie] : []
        this.caps = await capsService.listerPourSelect(this.perimetre?.academie?.id)
      }
    } catch {
      /* listes vides : l'API refusera de toute façon un rattachement invalide */
    } finally {
      this.chargementListes = false
    }
  },

  methods: {
    libelleRole,
    filtresInitiaux() {
      return { role: '', actif: '' }
    },
    chargerElements(params) {
      return utilisateursService.lister(params)
    },

    async chargerCaps() {
      this.formulaire.donnees.cap_id = ''
      this.chargementListes = true
      this.caps = await capsService.listerPourSelect(this.formulaire.academie_temp || null).catch(() => [])
      this.chargementListes = false
    },
    changerRole() {
      Object.assign(this.formulaire.donnees, { academie_id: '', cap_id: '', etablissement_id: '' })
    },

    ouvrirCreation() {
      this.formulaire = { ouvert: true, id: null, academie_temp: '', donnees: FORMULAIRE_VIDE(), chargement: false, erreur: '', erreurs: {} }
    },
    ouvrirModification(u) {
      const donnees = FORMULAIRE_VIDE()
      Object.keys(donnees).forEach((cle) => (donnees[cle] = u[cle] ?? ''))
      donnees.mot_de_passe = ''
      donnees.actif = String(u.actif)
      this.formulaire = { ouvert: true, id: u.id, academie_temp: u.academie_id || u.cap?.academie_id || '', donnees, chargement: false, erreur: '', erreurs: {} }
      if (u.role === ROLES.AGENT_CAP && this.estNational && this.formulaire.academie_temp) {
        capsService.listerPourSelect(this.formulaire.academie_temp).then((c) => (this.caps = c)).catch(() => {})
      }
    },
    async enregistrer() {
      this.formulaire.chargement = true
      this.formulaire.erreur = ''
      this.formulaire.erreurs = {}
      const d = this.formulaire.donnees
      // Corps : champs communs + le seul rattachement pertinent pour le rôle
      const corps = { nom: d.nom, prenom: d.prenom, email: d.email, role: d.role, actif: d.actif === 'true' }
      if (d.mot_de_passe) corps.mot_de_passe = d.mot_de_passe
      if (d.role === ROLES.ADMIN_ACADEMIE) corps.academie_id = d.academie_id
      if (d.role === ROLES.AGENT_CAP) corps.cap_id = d.cap_id
      if (d.role === ROLES.DIRECTEUR) corps.etablissement_id = d.etablissement_id
      try {
        if (this.formulaire.id) {
          await utilisateursService.modifier(this.formulaire.id, corps)
          this.succes = `Compte de ${d.prenom} ${d.nom} modifié.`
        } else {
          await utilisateursService.creer(corps)
          this.succes = `Compte de ${d.prenom} ${d.nom} créé.`
        }
        this.formulaire.ouvert = false
        await this.charger()
      } catch (e) {
        this.formulaire.erreur = e.message
        this.formulaire.erreurs = e.erreurs || {}
      } finally {
        this.formulaire.chargement = false
      }
    },

    async basculerActivation() {
      this.confirmation.chargement = true
      try {
        if (this.confirmation.action === 'activer') await utilisateursService.activer(this.confirmation.cible.id)
        else await utilisateursService.desactiver(this.confirmation.cible.id)
        this.succes = `Compte ${this.confirmation.action === 'activer' ? 'activé' : 'désactivé'}.`
        await this.charger()
      } catch (e) {
        this.erreurAction = e.message
      } finally {
        this.confirmation = { cible: null, action: null, chargement: false }
      }
    },
  },
}
</script>
