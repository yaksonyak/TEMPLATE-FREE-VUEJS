<!-- src/views/referentiels/AcademiesView.vue
     Objectif : gérer les Académies d'Enseignement (AE), premier niveau de l'organisation scolaire.
     Endpoints :
       GET    /academies            liste filtrée par le périmètre (recherche nom/code, filtre statut)
       GET    /academies/{id}       détail : CAP, lycées/techniques directs, effectifs consolidés
       POST   /academies            créer        → admin_national
       PUT    /academies/{id}       modifier     → admin_national
       DELETE /academies/{id}       RG-7 : désactivation si référencée
     Permissions : route admin_national + admin_academie (lecture de sa propre académie) ;
     boutons d'écriture via canEdit('academies'). -->
<template>
  <div class="space-y-4">
    <AppAlert v-if="succes" type="succes" :message="succes" fermable @fermer="succes = ''" />
    <AppAlert v-if="erreurAction" type="erreur" :message="erreurAction" fermable @fermer="erreurAction = ''" />

    <AppCard titre="Académies d'Enseignement" :sous-titre="`${pagination.total} académie(s)`" sans-marge>
      <template #actions>
        <select v-model="params.statut" aria-label="Filtrer par statut" class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white" @change="filtrer">
          <option value="">Tous statuts</option>
          <option value="actif">Actives</option>
          <option value="inactif">Inactives</option>
        </select>
        <input v-model="params.recherche" type="search" placeholder="Code ou nom…" aria-label="Rechercher une académie"
               class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-cnece-accent" />
        <AppButton v-if="peutEditer" taille="sm" @click="ouvrirCreation">+ Nouvelle académie</AppButton>
      </template>

      <AppTable :colonnes="colonnes" :lignes="elements" :chargement="chargement" :erreur="erreur"
                :tri="params.tri" :ordre="params.ordre" cliquable
                message-vide="Aucune académie." @trier="trier" @reessayer="charger" @ligne-cliquee="ouvrirDetail">
        <template #cellule-code="{ valeur }"><span class="font-mono font-semibold text-cnece-primary">{{ valeur }}</span></template>
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
    <AppModal :ouvert="detail.ouvert" :titre="detail.donnees ? `Académie ${detail.donnees.code} — ${detail.donnees.nom}` : 'Académie'" taille="xl" @fermer="detail.ouvert = false">
      <p v-if="detail.chargement" class="text-sm text-slate-500">Chargement…</p>
      <AppAlert v-else-if="detail.erreur" type="erreur" :message="detail.erreur" />
      <div v-else-if="detail.donnees" class="space-y-6">
        <dl class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div><dt class="text-slate-500">Directeur</dt><dd class="font-medium">{{ detail.donnees.directeur || '—' }}</dd></div>
          <div><dt class="text-slate-500">Téléphone</dt><dd class="font-medium">{{ detail.donnees.telephone || '—' }}</dd></div>
          <div><dt class="text-slate-500">E-mail</dt><dd class="font-medium">{{ detail.donnees.email || '—' }}</dd></div>
          <div><dt class="text-slate-500">Statut</dt><dd><AppBadge :valeur="detail.donnees.statut" famille="statut" /></dd></div>
        </dl>

        <EffectifsPanel :effectifs="detail.donnees.effectifs" />

        <section>
          <h3 class="text-sm font-semibold text-slate-700 mb-2">CAP rattachés ({{ (detail.donnees.caps || []).length }})</h3>
          <AppTable :colonnes="colonnesCaps" :lignes="detail.donnees.caps || []" message-vide="Aucun CAP.">
            <template #cellule-statut="{ valeur }"><AppBadge :valeur="valeur" famille="statut" /></template>
          </AppTable>
        </section>

        <section>
          <h3 class="text-sm font-semibold text-slate-700 mb-2">Lycées et établissements techniques ({{ (detail.donnees.etablissements_directs || []).length }})</h3>
          <AppTable :colonnes="colonnesEtabs" :lignes="detail.donnees.etablissements_directs || []" message-vide="Aucun établissement direct.">
            <template #cellule-ordre="{ valeur }"><AppBadge :valeur="valeur" famille="ordre" couleur="bleu" /></template>
            <template #cellule-statut="{ valeur }"><AppBadge :valeur="valeur" famille="statut" /></template>
          </AppTable>
        </section>
      </div>
    </AppModal>

    <!-- ===================== Formulaire création / modification ===================== -->
    <AppModal :ouvert="formulaire.ouvert" :titre="formulaire.id ? 'Modifier l’académie' : 'Nouvelle académie'" @fermer="formulaire.ouvert = false">
      <form id="form-academie" class="grid sm:grid-cols-2 gap-4" @submit.prevent="enregistrer">
        <AppAlert v-if="formulaire.erreur" type="erreur" :message="formulaire.erreur" class="sm:col-span-2" />
        <AppInput v-model="formulaire.donnees.code" label="Code" placeholder="01" maxlength="2" obligatoire
                  aide="2 chiffres, unique au niveau national (EE du matricule)" :erreur="formulaire.erreurs.code" />
        <AppSelect v-model="formulaire.donnees.statut" label="Statut" :options="optionsStatut" placeholder="Actif (défaut)" :erreur="formulaire.erreurs.statut" />
        <AppInput v-model="formulaire.donnees.nom" label="Nom" placeholder="Académie d'Enseignement de …" obligatoire class="sm:col-span-2" :erreur="formulaire.erreurs.nom" />
        <AppInput v-model="formulaire.donnees.directeur" label="Directeur" :erreur="formulaire.erreurs.directeur" />
        <AppInput v-model="formulaire.donnees.telephone" label="Téléphone" type="tel" placeholder="+223 …" :erreur="formulaire.erreurs.telephone" />
        <AppInput v-model="formulaire.donnees.email" label="E-mail" type="email" :erreur="formulaire.erreurs.email" />
        <AppInput v-model="formulaire.donnees.adresse" label="Adresse" :erreur="formulaire.erreurs.adresse" />
      </form>
      <template #pied>
        <AppButton variante="outline" :disabled="formulaire.chargement" @click="formulaire.ouvert = false">Annuler</AppButton>
        <AppButton type="submit" form="form-academie" :chargement="formulaire.chargement">Enregistrer</AppButton>
      </template>
    </AppModal>

    <!-- ===================== Confirmation suppression ===================== -->
    <AppConfirmModal :ouvert="Boolean(confirmation.cible)" titre="Supprimer l’académie"
      :message="`Supprimer « ${confirmation.cible?.nom} » ? Si elle est référencée (CAP, établissements, utilisateurs), elle sera seulement désactivée (RG-7).`"
      libelle-confirmer="Supprimer" variante="danger" :chargement="confirmation.chargement"
      @fermer="confirmation = { cible: null, chargement: false }" @confirmer="supprimer" />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import listeApi from '@/mixins/listeApi.js'
import academiesService from '@/services/academies.service.js'
import { useAuthStore } from '@/stores/auth.js'
import { canEdit } from '@/utils/permissions.js'
import { optionsDepuis, formaterNombre, libelle } from '@/utils/format.js'

const FORMULAIRE_VIDE = () => ({ code: '', nom: '', adresse: '', telephone: '', email: '', directeur: '', statut: '' })

export default {
  name: 'AcademiesView',
  mixins: [listeApi],

  data() {
    return {
      colonnes: [
        { cle: 'code', libelle: 'Code', triable: true, classe: 'w-20' },
        { cle: 'nom', libelle: 'Nom', triable: true },
        { cle: 'directeur', libelle: 'Directeur' },
        { cle: 'nb_caps', libelle: 'CAP', classe: 'w-20 text-right', format: formaterNombre },
        { cle: 'nb_etablissements', libelle: 'Établ.', classe: 'w-24 text-right', format: formaterNombre },
        { cle: 'statut', libelle: 'Statut', triable: true, classe: 'w-28' },
      ],
      colonnesCaps: [
        { cle: 'code', libelle: 'Code', classe: 'w-20' },
        { cle: 'nom', libelle: 'Nom' },
        { cle: 'directeur', libelle: 'Directeur' },
        { cle: 'nb_etablissements', libelle: 'Écoles', classe: 'w-24 text-right', format: formaterNombre },
        { cle: 'statut', libelle: 'Statut', classe: 'w-28' },
      ],
      colonnesEtabs: [
        { cle: 'code', libelle: 'Code', classe: 'w-32' },
        { cle: 'nom', libelle: 'Nom' },
        { cle: 'ordre', libelle: 'Ordre', classe: 'w-40' },
        { cle: 'statut_juridique', libelle: 'Statut jur.', classe: 'w-32', format: (v) => libelle('statut_juridique', v) },
        { cle: 'nb_eleves', libelle: 'Élèves', classe: 'w-24 text-right', format: formaterNombre },
        { cle: 'statut', libelle: 'Statut', classe: 'w-28' },
      ],
      optionsStatut: optionsDepuis('statut'),
      succes: '',
      erreurAction: '',
      detail: { ouvert: false, chargement: false, erreur: '', donnees: null },
      formulaire: { ouvert: false, id: null, donnees: FORMULAIRE_VIDE(), chargement: false, erreur: '', erreurs: {} },
      confirmation: { cible: null, chargement: false },
    }
  },

  computed: {
    ...mapState(useAuthStore, ['role']),
    peutEditer() {
      return canEdit('academies', this.role)
    },
  },

  methods: {
    filtresInitiaux() {
      return { statut: '' }
    },
    chargerElements(params) {
      return academiesService.lister(params)
    },

    // ------------------------------------------------ détail
    async ouvrirDetail(academie) {
      this.detail = { ouvert: true, chargement: true, erreur: '', donnees: null }
      try {
        this.detail.donnees = await academiesService.detail(academie.id)
      } catch (e) {
        this.detail.erreur = e.message
      } finally {
        this.detail.chargement = false
      }
    },

    // ------------------------------------------------ formulaire
    ouvrirCreation() {
      this.formulaire = { ouvert: true, id: null, donnees: FORMULAIRE_VIDE(), chargement: false, erreur: '', erreurs: {} }
    },
    ouvrirModification(academie) {
      // On ne copie que les champs modifiables (pas id, nb_caps, effectifs…)
      const donnees = FORMULAIRE_VIDE()
      Object.keys(donnees).forEach((cle) => (donnees[cle] = academie[cle] ?? ''))
      this.formulaire = { ouvert: true, id: academie.id, donnees, chargement: false, erreur: '', erreurs: {} }
    },
    async enregistrer() {
      this.formulaire.chargement = true
      this.formulaire.erreur = ''
      this.formulaire.erreurs = {}
      // Les champs vides ne sont pas envoyés (l'API applique ses défauts, ex. statut = actif)
      const corps = Object.fromEntries(Object.entries(this.formulaire.donnees).filter(([, v]) => v !== ''))
      try {
        if (this.formulaire.id) {
          await academiesService.modifier(this.formulaire.id, corps)
          this.succes = `Académie ${corps.nom} modifiée.`
        } else {
          await academiesService.creer(corps)
          this.succes = `Académie ${corps.nom} créée.`
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

    // ------------------------------------------------ suppression
    async supprimer() {
      this.confirmation.chargement = true
      try {
        const reponse = await academiesService.supprimer(this.confirmation.cible.id)
        this.succes = reponse?.message || 'Académie supprimée ou désactivée.'
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
