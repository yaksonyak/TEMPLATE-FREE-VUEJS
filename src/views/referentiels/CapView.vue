<!-- src/views/referentiels/CapView.vue
     Objectif : gérer les Centres d'Animation Pédagogique (CAP), qui encadrent les écoles
     fondamentales d'une académie. Le code (2 chiffres) est unique AU SEIN de l'académie.
     Endpoints :
       GET    /caps            (academie_id, statut, recherche nom/code/adresse)
       GET    /caps/{id}       détail : écoles (etablissements avec nb_eleves) + effectifs
       POST   /caps            admin_national, ou admin_academie pour son académie
       PUT    /caps/{id}
       DELETE /caps/{id}       RG-7
       GET    /academies       pour le filtre et le select du formulaire
     Permissions : route admin_national + admin_academie ; écriture via canEdit('caps'). -->
<template>
  <div class="space-y-4">
    <AppAlert v-if="succes" type="succes" :message="succes" fermable @fermer="succes = ''" />
    <AppAlert v-if="erreurAction" type="erreur" :message="erreurAction" fermable @fermer="erreurAction = ''" />

    <AppCard titre="Centres d'Animation Pédagogique" :sous-titre="`${pagination.total} CAP`" sans-marge>
      <template #actions>
        <!-- Le filtre académie n'a de sens que pour l'administrateur national -->
        <select v-if="estNational" v-model="params.academie_id" aria-label="Filtrer par académie"
                class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white max-w-56" @change="filtrer">
          <option value="">Toutes les académies</option>
          <option v-for="a in academies" :key="a.id" :value="a.id">{{ a.code }} — {{ a.nom }}</option>
        </select>
        <select v-model="params.statut" aria-label="Filtrer par statut" class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white" @change="filtrer">
          <option value="">Tous statuts</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
        </select>
        <input v-model="params.recherche" type="search" placeholder="Code, nom, adresse…" aria-label="Rechercher un CAP"
               class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-cnece-accent" />
        <AppButton v-if="peutEditer" taille="sm" @click="ouvrirCreation">+ Nouveau CAP</AppButton>
      </template>

      <AppTable :colonnes="colonnes" :lignes="elements" :chargement="chargement" :erreur="erreur"
                :tri="params.tri" :ordre="params.ordre" cliquable
                message-vide="Aucun CAP." @trier="trier" @reessayer="charger" @ligne-cliquee="ouvrirDetail">
        <template #cellule-code="{ valeur, ligne }">
          <span class="font-mono font-semibold text-cnece-primary">{{ ligne.academie?.code || '??' }}-{{ valeur }}</span>
        </template>
        <template #cellule-statut="{ valeur }"><AppBadge :valeur="valeur" famille="statut" /></template>
        <template #actions="{ ligne }">
          <div class="inline-flex gap-1">
            <AppIconButton action="voir" titre="Voir" @click="ouvrirDetail(ligne)" />
            <template v-if="peutEditer">
              <AppIconButton action="modifier" titre="Modifier" @click="ouvrirModification(ligne)" />
              <AppIconButton action="supprimer" titre="Supprimer" @click="confirmation = { cible: ligne, chargement: false }" />
            </template>
          </div>
        </template>
      </AppTable>

      <template #pied>
        <AppPagination :pagination="pagination" @changer-page="changerPage" @changer-taille="changerTaille" />
      </template>
    </AppCard>

    <!-- ===================== Fiche détail ===================== -->
    <AppModal :ouvert="detail.ouvert" :titre="detail.donnees ? `CAP ${detail.donnees.code} — ${detail.donnees.nom}` : 'CAP'" taille="xl" @fermer="detail.ouvert = false">
      <p v-if="detail.chargement" class="text-sm text-slate-500">Chargement…</p>
      <AppAlert v-else-if="detail.erreur" type="erreur" :message="detail.erreur" />
      <div v-else-if="detail.donnees" class="space-y-6">
        <dl class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div><dt class="text-slate-500">Académie</dt><dd class="font-medium">{{ detail.donnees.academie?.nom || '—' }}</dd></div>
          <div><dt class="text-slate-500">Directeur</dt><dd class="font-medium">{{ detail.donnees.directeur || '—' }}</dd></div>
          <div><dt class="text-slate-500">Téléphone</dt><dd class="font-medium">{{ detail.donnees.telephone || '—' }}</dd></div>
          <div><dt class="text-slate-500">Statut</dt><dd><AppBadge :valeur="detail.donnees.statut" famille="statut" /></dd></div>
        </dl>

        <EffectifsPanel :effectifs="detail.donnees.effectifs" />

        <section>
          <h3 class="text-sm font-semibold text-slate-700 mb-2">Écoles fondamentales ({{ (detail.donnees.etablissements || []).length }})</h3>
          <AppTable :colonnes="colonnesEcoles" :lignes="detail.donnees.etablissements || []" message-vide="Aucune école rattachée.">
            <template #cellule-statut="{ valeur }"><AppBadge :valeur="valeur" famille="statut" /></template>
          </AppTable>
        </section>
      </div>
    </AppModal>

    <!-- ===================== Formulaire ===================== -->
    <AppModal :ouvert="formulaire.ouvert" :titre="formulaire.id ? 'Modifier le CAP' : 'Nouveau CAP'" @fermer="formulaire.ouvert = false">
      <form id="form-cap" class="grid sm:grid-cols-2 gap-4" @submit.prevent="enregistrer">
        <AppAlert v-if="formulaire.erreur" type="erreur" :message="formulaire.erreur" class="sm:col-span-2" />
        <AppSelect v-model="formulaire.donnees.academie_id" label="Académie" :options="academies" cle-valeur="id" cle-libelle="nom"
                   numerique obligatoire :disabled="!estNational" :chargement="chargementAcademies"
                   :aide="estNational ? '' : 'Votre académie (périmètre)'" :erreur="formulaire.erreurs.academie_id" class="sm:col-span-2" />
        <AppInput v-model="formulaire.donnees.code" label="Code" placeholder="01" maxlength="2" obligatoire
                  aide="2 chiffres, unique dans l'académie (CC du matricule)" :erreur="formulaire.erreurs.code" />
        <AppSelect v-model="formulaire.donnees.statut" label="Statut" :options="optionsStatut" placeholder="Actif (défaut)" :erreur="formulaire.erreurs.statut" />
        <AppInput v-model="formulaire.donnees.nom" label="Nom" placeholder="CAP de …" obligatoire class="sm:col-span-2" :erreur="formulaire.erreurs.nom" />
        <AppInput v-model="formulaire.donnees.directeur" label="Directeur" :erreur="formulaire.erreurs.directeur" />
        <AppInput v-model="formulaire.donnees.telephone" label="Téléphone" type="tel" :erreur="formulaire.erreurs.telephone" />
        <AppInput v-model="formulaire.donnees.adresse" label="Adresse" class="sm:col-span-2" :erreur="formulaire.erreurs.adresse" />
      </form>
      <template #pied>
        <AppButton variante="outline" :disabled="formulaire.chargement" @click="formulaire.ouvert = false">Annuler</AppButton>
        <AppButton type="submit" form="form-cap" :chargement="formulaire.chargement">Enregistrer</AppButton>
      </template>
    </AppModal>

    <AppConfirmModal :ouvert="Boolean(confirmation.cible)" titre="Supprimer le CAP"
      :message="`Supprimer « ${confirmation.cible?.nom} » ? S'il est référencé (écoles, utilisateurs), il sera seulement désactivé (RG-7).`"
      libelle-confirmer="Supprimer" variante="danger" :chargement="confirmation.chargement"
      @fermer="confirmation = { cible: null, chargement: false }" @confirmer="supprimer" />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import listeApi from '@/mixins/listeApi.js'
import capsService from '@/services/caps.service.js'
import academiesService from '@/services/academies.service.js'
import { useAuthStore } from '@/stores/auth.js'
import { canEdit } from '@/utils/permissions.js'
import { optionsDepuis, formaterNombre, libelle } from '@/utils/format.js'

const FORMULAIRE_VIDE = () => ({ code: '', nom: '', academie_id: '', adresse: '', telephone: '', directeur: '', statut: '' })

export default {
  name: 'CapView',
  mixins: [listeApi],

  data() {
    return {
      colonnes: [
        { cle: 'code', libelle: 'Code', triable: true, classe: 'w-24' },
        { cle: 'nom', libelle: 'Nom', triable: true },
        { cle: 'academie.nom', libelle: 'Académie' },
        { cle: 'directeur', libelle: 'Directeur' },
        { cle: 'nb_etablissements', libelle: 'Écoles', classe: 'w-24 text-right', format: formaterNombre },
        { cle: 'statut', libelle: 'Statut', triable: true, classe: 'w-28' },
      ],
      colonnesEcoles: [
        { cle: 'code', libelle: 'Code', classe: 'w-32' },
        { cle: 'nom', libelle: 'Nom' },
        { cle: 'cycles', libelle: 'Cycles', format: (v) => libelle('cycles', v) },
        { cle: 'statut_juridique', libelle: 'Statut jur.', classe: 'w-32', format: (v) => libelle('statut_juridique', v) },
        { cle: 'nb_eleves', libelle: 'Élèves', classe: 'w-24 text-right', format: formaterNombre },
        { cle: 'statut', libelle: 'Statut', classe: 'w-28' },
      ],
      optionsStatut: optionsDepuis('statut'),
      academies: [],
      chargementAcademies: false,
      succes: '',
      erreurAction: '',
      detail: { ouvert: false, chargement: false, erreur: '', donnees: null },
      formulaire: { ouvert: false, id: null, donnees: FORMULAIRE_VIDE(), chargement: false, erreur: '', erreurs: {} },
      confirmation: { cible: null, chargement: false },
    }
  },

  computed: {
    ...mapState(useAuthStore, ['role', 'perimetre', 'niveauPerimetre']),
    peutEditer() {
      return canEdit('caps', this.role)
    },
    estNational() {
      return this.niveauPerimetre === 'national'
    },
  },

  // created() du mixin charge la liste ; ici on charge en plus les académies pour les selects.
  async created() {
    this.chargementAcademies = true
    try {
      this.academies = await academiesService.listerPourSelect()
    } catch {
      this.academies = []
    } finally {
      this.chargementAcademies = false
    }
  },

  methods: {
    filtresInitiaux() {
      return { academie_id: '', statut: '' }
    },
    chargerElements(params) {
      return capsService.lister(params)
    },

    async ouvrirDetail(cap) {
      this.detail = { ouvert: true, chargement: true, erreur: '', donnees: null }
      try {
        this.detail.donnees = await capsService.detail(cap.id)
      } catch (e) {
        this.detail.erreur = e.message
      } finally {
        this.detail.chargement = false
      }
    },

    ouvrirCreation() {
      const donnees = FORMULAIRE_VIDE()
      // Admin d'académie : l'académie est imposée par son périmètre
      if (!this.estNational) donnees.academie_id = this.perimetre?.academie?.id ?? ''
      this.formulaire = { ouvert: true, id: null, donnees, chargement: false, erreur: '', erreurs: {} }
    },
    ouvrirModification(cap) {
      const donnees = FORMULAIRE_VIDE()
      Object.keys(donnees).forEach((cle) => (donnees[cle] = cap[cle] ?? ''))
      this.formulaire = { ouvert: true, id: cap.id, donnees, chargement: false, erreur: '', erreurs: {} }
    },
    async enregistrer() {
      this.formulaire.chargement = true
      this.formulaire.erreur = ''
      this.formulaire.erreurs = {}
      const corps = Object.fromEntries(Object.entries(this.formulaire.donnees).filter(([, v]) => v !== ''))
      try {
        if (this.formulaire.id) {
          await capsService.modifier(this.formulaire.id, corps)
          this.succes = `CAP ${corps.nom} modifié.`
        } else {
          await capsService.creer(corps)
          this.succes = `CAP ${corps.nom} créé.`
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

    async supprimer() {
      this.confirmation.chargement = true
      try {
        const reponse = await capsService.supprimer(this.confirmation.cible.id)
        this.succes = reponse?.message || 'CAP supprimé ou désactivé.'
        await this.charger()
      } catch (e) {
        this.erreurAction = e.message
      } finally {
        this.confirmation = { cible: null, chargement: false }
      }
    },
  },
}
</script>
