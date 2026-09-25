<!-- src/views/referentiels/AnneesScolairesView.vue
     Objectif : gérer les années scolaires (sessions). Une seule est active à la fois (RG-9) :
     toutes les inscriptions, candidatures et statistiques s'y rattachent.
     Endpoints :
       GET    /annees-scolaires                (liste, filtre active)
       POST   /annees-scolaires                (créer)          → admin_national
       PUT    /annees-scolaires/{id}           (modifier)       → admin_national
       DELETE /annees-scolaires/{id}           (supprimer, 409 si active ou référencée)
       POST   /annees-scolaires/{id}/activer   (activer, désactive les autres)
     Permissions : route réservée à admin_national ; les boutons d'écriture
     passent aussi par canEdit('annees_scolaires') pour rester cohérents. -->
<template>
  <div class="space-y-4">
    <AppAlert v-if="succes" type="succes" :message="succes" fermable @fermer="succes = ''" />
    <AppAlert v-if="erreurAction" type="erreur" :message="erreurAction" fermable @fermer="erreurAction = ''" />

    <AppCard titre="Années scolaires" sous-titre="Une seule année peut être active à la fois" sans-marge>
      <template #actions>
        <select
          v-model="params.active"
          aria-label="Filtrer par état"
          class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white"
          @change="filtrer"
        >
          <option value="">Toutes</option>
          <option value="true">Active</option>
          <option value="false">Inactives</option>
        </select>
        <AppButton v-if="peutEditer" taille="sm" @click="ouvrirCreation">+ Nouvelle année</AppButton>
      </template>

      <AppTable
        :colonnes="colonnes"
        :lignes="elements"
        :chargement="chargement"
        :erreur="erreur"
        :tri="params.tri"
        :ordre="params.ordre"
        message-vide="Aucune année scolaire."
        @trier="trier"
        @reessayer="charger"
      >
        <template #cellule-libelle="{ valeur, ligne }">
          <span class="font-semibold text-slate-800">{{ valeur }}</span>
          <span v-if="ligne.active" class="ml-2 text-xs text-cnece-accent font-medium">● en cours</span>
        </template>
        <template #cellule-active="{ valeur }">
          <AppBadge :valeur="valeur" />
        </template>

        <template #actions="{ ligne }">
          <div v-if="peutEditer" class="inline-flex gap-1">
            <AppButton
              v-if="!ligne.active"
              variante="success"
              taille="sm"
              @click="demanderActivation(ligne)"
            >
              Activer
            </AppButton>
            <AppButton variante="outline" taille="sm" @click="ouvrirModification(ligne)">Modifier</AppButton>
            <AppButton
              v-if="!ligne.active"
              variante="danger"
              taille="sm"
              @click="demanderSuppression(ligne)"
            >
              Supprimer
            </AppButton>
          </div>
        </template>
      </AppTable>

      <template #pied>
        <AppPagination :pagination="pagination" @changer-page="changerPage" @changer-taille="changerTaille" />
      </template>
    </AppCard>

    <!-- Modale création / modification (même formulaire, titre différent) -->
    <AppModal :ouvert="formulaire.ouvert" :titre="formulaire.id ? 'Modifier l’année scolaire' : 'Nouvelle année scolaire'" taille="sm" @fermer="fermerFormulaire">
      <form id="form-annee" class="space-y-4" @submit.prevent="enregistrer">
        <AppAlert v-if="formulaire.erreur" type="erreur" :message="formulaire.erreur" />
        <AppInput
          v-model="formulaire.donnees.libelle"
          label="Libellé"
          placeholder="2027-2028"
          aide="Format attendu : AAAA-AAAA"
          obligatoire
          :erreur="formulaire.erreurs.libelle"
        />
        <label class="inline-flex items-center gap-2 text-sm text-slate-700">
          <input v-model="formulaire.donnees.active" type="checkbox" class="rounded border-slate-300 text-cnece-primary" />
          Activer immédiatement cette année (désactive les autres)
        </label>
      </form>
      <template #pied>
        <AppButton variante="outline" :disabled="formulaire.chargement" @click="fermerFormulaire">Annuler</AppButton>
        <AppButton type="submit" form="form-annee" :chargement="formulaire.chargement">Enregistrer</AppButton>
      </template>
    </AppModal>

    <!-- Confirmation d'activation -->
    <AppConfirmModal
      :ouvert="confirmation.type === 'activer'"
      titre="Activer l’année scolaire"
      :message="`Activer ${confirmation.cible?.libelle} ? L’année actuellement active sera désactivée.`"
      libelle-confirmer="Activer"
      variante="success"
      :chargement="confirmation.chargement"
      @fermer="fermerConfirmation"
      @confirmer="activer"
    />

    <!-- Confirmation de suppression -->
    <AppConfirmModal
      :ouvert="confirmation.type === 'supprimer'"
      titre="Supprimer l’année scolaire"
      :message="`Supprimer ${confirmation.cible?.libelle} ? Refusé par l’API si elle est référencée par des inscriptions.`"
      libelle-confirmer="Supprimer"
      variante="danger"
      :chargement="confirmation.chargement"
      @fermer="fermerConfirmation"
      @confirmer="supprimer"
    />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import listeApi from '@/mixins/listeApi.js'
import referentielsService from '@/services/referentiels.service.js'
import { useAuthStore } from '@/stores/auth.js'
import { useReferentielsStore } from '@/stores/referentiels.js'
import { canEdit } from '@/utils/permissions.js'
import { formaterNombre } from '@/utils/format.js'

export default {
  name: 'AnneesScolairesView',
  mixins: [listeApi],

  data() {
    return {
      colonnes: [
        { cle: 'libelle', libelle: 'Année', triable: true },
        { cle: 'active', libelle: 'État', triable: true, classe: 'w-28' },
        { cle: 'nb_inscriptions', libelle: 'Inscriptions', classe: 'w-36 text-right', format: formaterNombre },
      ],
      succes: '',
      erreurAction: '', // erreur d'une action (403, 409…) affichée au-dessus de la liste
      // État du formulaire (création si id null, modification sinon)
      formulaire: {
        ouvert: false,
        id: null,
        donnees: { libelle: '', active: false },
        chargement: false,
        erreur: '',
        erreurs: {},
      },
      // État des confirmations (activer / supprimer)
      confirmation: { type: null, cible: null, chargement: false },
    }
  },

  computed: {
    ...mapState(useAuthStore, ['role']),
    peutEditer() {
      return canEdit('annees_scolaires', this.role)
    },
  },

  methods: {
    ...mapActions(useReferentielsStore, ['rechargerAnneeActive']),

    filtresInitiaux() {
      return { active: '' }
    },
    chargerElements(params) {
      return referentielsService.listerAnneesScolaires(params)
    },

    // ----------------------------------------------------- formulaire
    ouvrirCreation() {
      this.formulaire = {
        ouvert: true, id: null, donnees: { libelle: '', active: false },
        chargement: false, erreur: '', erreurs: {},
      }
    },
    ouvrirModification(annee) {
      this.formulaire = {
        ouvert: true, id: annee.id, donnees: { libelle: annee.libelle, active: annee.active },
        chargement: false, erreur: '', erreurs: {},
      }
    },
    fermerFormulaire() {
      this.formulaire.ouvert = false
    },
    async enregistrer() {
      this.formulaire.chargement = true
      this.formulaire.erreur = ''
      this.formulaire.erreurs = {}
      try {
        if (this.formulaire.id) {
          await referentielsService.modifierAnneeScolaire(this.formulaire.id, this.formulaire.donnees)
          this.succes = `Année ${this.formulaire.donnees.libelle} modifiée.`
        } else {
          await referentielsService.creerAnneeScolaire(this.formulaire.donnees)
          this.succes = `Année ${this.formulaire.donnees.libelle} créée.`
        }
        this.fermerFormulaire()
        await this.charger()
        if (this.formulaire.donnees.active) await this.rechargerAnneeActive()
      } catch (e) {
        // 422 : erreurs par champ ; 403/409 : message global
        this.formulaire.erreur = e.message
        this.formulaire.erreurs = e.erreurs || {}
      } finally {
        this.formulaire.chargement = false
      }
    },

    // ----------------------------------------------------- confirmations
    demanderActivation(annee) {
      this.confirmation = { type: 'activer', cible: annee, chargement: false }
    },
    demanderSuppression(annee) {
      this.confirmation = { type: 'supprimer', cible: annee, chargement: false }
    },
    fermerConfirmation() {
      this.confirmation = { type: null, cible: null, chargement: false }
    },
    async activer() {
      await this.executerConfirmation(
        () => referentielsService.activerAnneeScolaire(this.confirmation.cible.id),
        `Année ${this.confirmation.cible.libelle} activée.`,
        true
      )
    },
    async supprimer() {
      await this.executerConfirmation(
        () => referentielsService.supprimerAnneeScolaire(this.confirmation.cible.id),
        `Année ${this.confirmation.cible.libelle} supprimée.`
      )
    },
    /** Factorise : appel API, message de succès, rechargement, erreur affichée dans la liste. */
    async executerConfirmation(action, messageSucces, rafraichirAnneeActive = false) {
      this.confirmation.chargement = true
      try {
        await action()
        this.succes = messageSucces
        this.fermerConfirmation()
        await this.charger()
        if (rafraichirAnneeActive) await this.rechargerAnneeActive()
      } catch (e) {
        this.fermerConfirmation()
        this.erreurAction = e.message // ex. 409 : année active ou référencée par des inscriptions
      }
    },
  },
}
</script>
