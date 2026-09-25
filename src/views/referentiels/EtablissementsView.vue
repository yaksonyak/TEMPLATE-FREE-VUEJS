<!-- src/views/referentiels/EtablissementsView.vue
     Objectif : gérer les établissements des trois ordres d'enseignement.
       - fondamental          → rattaché à un CAP (academie déduite), cycles obligatoires
       - lycee                → rattaché à une académie, séries offertes
       - technique_professionnel → rattaché à une académie, filières offertes
     Règle RG-1 appliquée dans le formulaire : les champs affichés et obligatoires
     dépendent de l'ordre choisi ; communautaire / medersa réservés au fondamental.
     Endpoints :
       GET    /etablissements          (academie_id, cap_id, ordre, statut_juridique, statut, recherche)
       GET    /etablissements/{id}     détail : series, filieres, effectifs
       POST   /etablissements          admin_national, admin_academie (son académie), agent_cap (écoles de son CAP)
       PUT    /etablissements/{id}
       DELETE /etablissements/{id}     RG-7
       GET    /academies, /caps, /series, /filieres  pour les filtres et selects
     Permissions : route admin_national + admin_academie + agent_cap ; écriture via canEdit('etablissements') ;
     un agent CAP ne peut créer que des écoles fondamentales. -->
<template>
  <div class="space-y-4">
    <AppAlert v-if="succes" type="succes" :message="succes" fermable @fermer="succes = ''" />
    <AppAlert v-if="erreurAction" type="erreur" :message="erreurAction" fermable @fermer="erreurAction = ''" />

    <AppCard titre="Établissements" :sous-titre="`${pagination.total} établissement(s)`" sans-marge>
      <template #actions>
        <AppButton v-if="peutEditer" taille="sm" @click="ouvrirCreation">+ Nouvel établissement</AppButton>
      </template>

      <!-- Barre de filtres -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-6 gap-3 p-4 border-b border-slate-200 bg-slate-50">
        <select v-model="params.ordre_enseignement" aria-label="Ordre d'enseignement" class="champ-filtre" @change="filtrer">
          <option value="">Tous les ordres</option>
          <option v-for="o in optionsOrdre" :key="o.valeur" :value="o.valeur">{{ o.libelle }}</option>
        </select>
        <select v-if="estNational" v-model="params.academie_id" aria-label="Académie" class="champ-filtre" @change="changerAcademieFiltre">
          <option value="">Toutes les académies</option>
          <option v-for="a in academies" :key="a.id" :value="a.id">{{ a.nom }}</option>
        </select>
        <select v-if="niveauPerimetre !== 'cap'" v-model="params.cap_id" aria-label="CAP" class="champ-filtre" @change="filtrer">
          <option value="">Tous les CAP</option>
          <option v-for="c in capsFiltre" :key="c.id" :value="c.id">{{ c.nom }}</option>
        </select>
        <select v-model="params.statut_juridique" aria-label="Statut juridique" class="champ-filtre" @change="filtrer">
          <option value="">Tous statuts juridiques</option>
          <option v-for="o in optionsStatutJuridique" :key="o.valeur" :value="o.valeur">{{ o.libelle }}</option>
        </select>
        <select v-model="params.statut" aria-label="Statut" class="champ-filtre" @change="filtrer">
          <option value="">Actifs et inactifs</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
        </select>
        <input v-model="params.recherche" type="search" placeholder="Nom, code, localité…" aria-label="Rechercher" class="champ-filtre" />
      </div>

      <AppTable :colonnes="colonnes" :lignes="elements" :chargement="chargement" :erreur="erreur"
                :tri="params.tri" :ordre="params.ordre" cliquable
                message-vide="Aucun établissement ne correspond aux filtres." @trier="trier" @reessayer="charger" @ligne-cliquee="ouvrirDetail">
        <template #cellule-code="{ valeur }"><span class="font-mono text-xs font-semibold text-cnece-primary">{{ valeur }}</span></template>
        <template #cellule-ordre="{ valeur }"><AppBadge :valeur="valeur" famille="ordre" :couleur="couleurOrdre(valeur)" /></template>
        <template #cellule-rattachement="{ ligne }">
          <span class="text-xs">{{ ligne.cap?.nom || ligne.academie?.nom || '—' }}</span>
        </template>
        <template #cellule-statut="{ valeur }"><AppBadge :valeur="valeur" famille="statut" /></template>
        <template #actions="{ ligne }">
          <div class="inline-flex gap-1">
            <AppIconButton action="voir" titre="Voir" @click="ouvrirDetail(ligne)" />
            <template v-if="peutEditerLigne(ligne)">
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
    <AppModal :ouvert="detail.ouvert" :titre="detail.donnees ? detail.donnees.nom : 'Établissement'" taille="xl" @fermer="detail.ouvert = false">
      <p v-if="detail.chargement" class="text-sm text-slate-500">Chargement…</p>
      <AppAlert v-else-if="detail.erreur" type="erreur" :message="detail.erreur" />
      <div v-else-if="detail.donnees" class="space-y-6">
        <dl class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div><dt class="text-slate-500">Code</dt><dd class="font-mono font-medium">{{ detail.donnees.code }}</dd></div>
          <div><dt class="text-slate-500">Ordre</dt><dd><AppBadge :valeur="detail.donnees.ordre" famille="ordre" :couleur="couleurOrdre(detail.donnees.ordre)" /></dd></div>
          <div><dt class="text-slate-500">Statut juridique</dt><dd class="font-medium">{{ libelle('statut_juridique', detail.donnees.statut_juridique) }}</dd></div>
          <div><dt class="text-slate-500">Statut</dt><dd><AppBadge :valeur="detail.donnees.statut" famille="statut" /></dd></div>
          <div><dt class="text-slate-500">Académie</dt><dd class="font-medium">{{ detail.donnees.academie?.nom || '—' }}</dd></div>
          <div><dt class="text-slate-500">CAP</dt><dd class="font-medium">{{ detail.donnees.cap?.nom || '—' }}</dd></div>
          <div><dt class="text-slate-500">Cycles</dt><dd class="font-medium">{{ libelle('cycles', detail.donnees.cycles) }}</dd></div>
          <div><dt class="text-slate-500">Localité</dt><dd class="font-medium">{{ detail.donnees.localite || '—' }}</dd></div>
          <div><dt class="text-slate-500">Directeur</dt><dd class="font-medium">{{ detail.donnees.directeur || '—' }}</dd></div>
          <div><dt class="text-slate-500">Téléphone</dt><dd class="font-medium">{{ detail.donnees.telephone || '—' }}</dd></div>
          <div><dt class="text-slate-500">Salles</dt><dd class="font-medium">{{ detail.donnees.nb_salles ?? '—' }}</dd></div>
        </dl>

        <div v-if="detail.donnees.series?.length" class="text-sm">
          <span class="text-slate-500 mr-2">Séries offertes :</span>
          <AppBadge v-for="s in detail.donnees.series" :key="s.id" :valeur="s.code" couleur="bleu" class="mr-1" />
        </div>
        <div v-if="detail.donnees.filieres?.length" class="text-sm">
          <span class="text-slate-500 mr-2">Filières offertes :</span>
          <AppBadge v-for="f in detail.donnees.filieres" :key="f.id" :valeur="`${f.code} (${f.diplome})`" couleur="ambre" class="mr-1" />
        </div>

        <EffectifsPanel :effectifs="detail.donnees.effectifs" />
      </div>
    </AppModal>

    <!-- ===================== Formulaire (RG-1) ===================== -->
    <AppModal :ouvert="formulaire.ouvert" :titre="formulaire.id ? 'Modifier l’établissement' : 'Nouvel établissement'" taille="lg" @fermer="formulaire.ouvert = false">
      <form id="form-etab" class="grid sm:grid-cols-2 gap-4" @submit.prevent="enregistrer">
        <AppAlert v-if="formulaire.erreur" type="erreur" :message="formulaire.erreur" class="sm:col-span-2" />

        <!-- 1. L'ordre pilote le reste du formulaire -->
        <AppSelect v-model="formulaire.donnees.ordre" label="Ordre d'enseignement" :options="optionsOrdreFormulaire" obligatoire
                   :disabled="Boolean(formulaire.id)" aide="Non modifiable après création" :erreur="formulaire.erreurs.ordre" @update:model-value="changerOrdre" />
        <AppSelect v-model="formulaire.donnees.statut_juridique" label="Statut juridique" :options="optionsStatutJuridiqueFormulaire" obligatoire :erreur="formulaire.erreurs.statut_juridique" />

        <AppInput v-model="formulaire.donnees.code" label="Code" placeholder="EF-0101-12" obligatoire :erreur="formulaire.erreurs.code" />
        <AppInput v-model="formulaire.donnees.nom" label="Nom" obligatoire :erreur="formulaire.erreurs.nom" />

        <!-- 2a. Fondamental : CAP + cycles -->
        <template v-if="estFondamental">
          <AppSelect v-if="estNational" v-model="formulaire.academie_id_temp" label="Académie (pour choisir le CAP)" :options="academies" cle-valeur="id" cle-libelle="nom" numerique
                     :chargement="chargementAcademies" @update:model-value="chargerCapsFormulaire" />
          <AppSelect v-model="formulaire.donnees.cap_id" label="CAP de rattachement" :options="capsFormulaire" cle-valeur="id" cle-libelle="nom" numerique obligatoire
                     :disabled="niveauPerimetre === 'cap'" :chargement="chargementCaps" :aide="niveauPerimetre === 'cap' ? 'Votre CAP (périmètre)' : 'L’académie est déduite du CAP'" :erreur="formulaire.erreurs.cap_id" />
          <AppSelect v-model="formulaire.donnees.cycles" label="Cycles offerts" :options="optionsCycles" obligatoire :erreur="formulaire.erreurs.cycles" />
        </template>

        <!-- 2b. Lycée / technique : académie + séries ou filières -->
        <template v-else-if="formulaire.donnees.ordre">
          <AppSelect v-model="formulaire.donnees.academie_id" label="Académie de rattachement" :options="academies" cle-valeur="id" cle-libelle="nom" numerique obligatoire
                     :disabled="!estNational" :chargement="chargementAcademies" :aide="estNational ? '' : 'Votre académie (périmètre)'" :erreur="formulaire.erreurs.academie_id" />
          <fieldset class="sm:col-span-2">
            <legend class="block text-sm font-medium text-slate-700 mb-1">
              {{ estLycee ? 'Séries offertes' : 'Filières offertes' }}
            </legend>
            <div class="grid sm:grid-cols-2 gap-1 max-h-40 overflow-y-auto rounded-lg border border-slate-300 p-3">
              <label v-for="opt in (estLycee ? optionsSeries : optionsFilieres())" :key="opt.valeur" class="inline-flex items-center gap-2 text-sm">
                <input v-model="formulaire.donnees[estLycee ? 'series' : 'filieres']" type="checkbox" :value="opt.valeur" class="rounded border-slate-300" />
                {{ opt.libelle }}
              </label>
            </div>
            <p v-if="formulaire.erreurs.series || formulaire.erreurs.filieres" class="mt-1 text-xs text-cnece-danger">
              {{ (formulaire.erreurs.series || formulaire.erreurs.filieres)[0] }}
            </p>
          </fieldset>
        </template>

        <!-- 3. Champs communs -->
        <AppInput v-model="formulaire.donnees.localite" label="Localité" :erreur="formulaire.erreurs.localite" />
        <AppInput v-model="formulaire.donnees.nb_salles" label="Nombre de salles" type="number" min="0" :erreur="formulaire.erreurs.nb_salles" />
        <AppInput v-model="formulaire.donnees.directeur" label="Directeur" :erreur="formulaire.erreurs.directeur" />
        <AppInput v-model="formulaire.donnees.telephone" label="Téléphone" type="tel" :erreur="formulaire.erreurs.telephone" />
        <AppSelect v-if="formulaire.id" v-model="formulaire.donnees.statut" label="Statut" :options="optionsStatut" :erreur="formulaire.erreurs.statut" />
      </form>
      <template #pied>
        <AppButton variante="outline" :disabled="formulaire.chargement" @click="formulaire.ouvert = false">Annuler</AppButton>
        <AppButton type="submit" form="form-etab" :chargement="formulaire.chargement">Enregistrer</AppButton>
      </template>
    </AppModal>

    <AppConfirmModal :ouvert="Boolean(confirmation.cible)" titre="Supprimer l’établissement"
      :message="`Supprimer « ${confirmation.cible?.nom} » ? S'il a des inscriptions, il sera seulement désactivé (RG-7).`"
      libelle-confirmer="Supprimer" variante="danger" :chargement="confirmation.chargement"
      @fermer="confirmation = { cible: null, chargement: false }" @confirmer="supprimer" />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import listeApi from '@/mixins/listeApi.js'
import etablissementsService from '@/services/etablissements.service.js'
import academiesService from '@/services/academies.service.js'
import capsService from '@/services/caps.service.js'
import { useAuthStore } from '@/stores/auth.js'
import { useReferentielsStore } from '@/stores/referentiels.js'
import { canEdit, ROLES } from '@/utils/permissions.js'
import { optionsDepuis, formaterNombre, libelle } from '@/utils/format.js'

const FORMULAIRE_VIDE = () => ({
  code: '', nom: '', ordre: '', statut_juridique: '', cap_id: '', academie_id: '', cycles: '',
  localite: '', telephone: '', directeur: '', nb_salles: '', statut: '', series: [], filieres: [],
})

export default {
  name: 'EtablissementsView',
  mixins: [listeApi],

  data() {
    return {
      colonnes: [
        { cle: 'code', libelle: 'Code', triable: true, classe: 'w-32' },
        { cle: 'nom', libelle: 'Nom', triable: true },
        { cle: 'ordre', libelle: 'Ordre', triable: true, classe: 'w-36' },
        { cle: 'rattachement', libelle: 'CAP / Académie' },
        { cle: 'statut_juridique', libelle: 'Statut jur.', triable: true, classe: 'w-32', format: (v) => libelle('statut_juridique', v) },
        { cle: 'localite', libelle: 'Localité', triable: true },
        { cle: 'nb_eleves', libelle: 'Élèves', classe: 'w-20 text-right', format: formaterNombre },
        { cle: 'statut', libelle: 'Statut', triable: true, classe: 'w-24' },
      ],
      optionsOrdre: optionsDepuis('ordre'),
      optionsStatutJuridique: optionsDepuis('statut_juridique'),
      optionsCycles: optionsDepuis('cycles'),
      optionsStatut: optionsDepuis('statut'),
      academies: [],
      capsFiltre: [],
      capsFormulaire: [],
      chargementAcademies: false,
      chargementCaps: false,
      succes: '',
      erreurAction: '',
      detail: { ouvert: false, chargement: false, erreur: '', donnees: null },
      formulaire: { ouvert: false, id: null, academie_id_temp: '', donnees: FORMULAIRE_VIDE(), chargement: false, erreur: '', erreurs: {} },
      confirmation: { cible: null, chargement: false },
    }
  },

  computed: {
    ...mapState(useAuthStore, ['role', 'perimetre', 'niveauPerimetre']),
    ...mapState(useReferentielsStore, ['optionsSeries', 'optionsFilieres']),
    peutEditer() {
      return canEdit('etablissements', this.role)
    },
    estNational() {
      return this.niveauPerimetre === 'national'
    },
    estFondamental() {
      return this.formulaire.donnees.ordre === 'fondamental'
    },
    estLycee() {
      return this.formulaire.donnees.ordre === 'lycee'
    },
    /** Un agent CAP ne crée que des écoles fondamentales. */
    optionsOrdreFormulaire() {
      return this.role === ROLES.AGENT_CAP ? this.optionsOrdre.filter((o) => o.valeur === 'fondamental') : this.optionsOrdre
    },
    /** RG-1 : communautaire et medersa réservés au fondamental. */
    optionsStatutJuridiqueFormulaire() {
      if (this.estFondamental || !this.formulaire.donnees.ordre) return this.optionsStatutJuridique
      return this.optionsStatutJuridique.filter((o) => ['public', 'prive'].includes(o.valeur))
    },
  },

  async created() {
    // Référentiels (séries, filières) en cache + académies et CAP pour les filtres.
    this.chargementAcademies = true
    try {
      await Promise.all([
        this.chargerTout(),
        this.estNational ? academiesService.listerPourSelect().then((a) => (this.academies = a)) : Promise.resolve(),
        this.niveauPerimetre !== 'cap' ? capsService.listerPourSelect(this.estNational ? null : this.perimetre?.academie?.id).then((c) => (this.capsFiltre = c)) : Promise.resolve(),
      ])
      // Admin académie : la liste ne contient que la sienne (utile pour les libellés)
      if (!this.estNational && this.perimetre?.academie) this.academies = [this.perimetre.academie]
    } catch {
      /* les filtres resteront vides ; la liste principale a son propre état d'erreur */
    } finally {
      this.chargementAcademies = false
    }
  },

  methods: {
    ...mapActions(useReferentielsStore, ['chargerTout']),
    libelle,

    filtresInitiaux() {
      return { ordre_enseignement: '', academie_id: '', cap_id: '', statut_juridique: '', statut: '' }
    },
    chargerElements(params) {
      return etablissementsService.lister(params)
    },
    couleurOrdre(ordre) {
      return { fondamental: 'vert', lycee: 'bleu', technique_professionnel: 'ambre' }[ordre] || 'gris'
    },
    /** Un agent CAP ne modifie que les écoles fondamentales (le reste est hors périmètre). */
    peutEditerLigne(ligne) {
      if (!this.peutEditer) return false
      return this.role !== ROLES.AGENT_CAP || ligne.ordre === 'fondamental'
    },

    /** Filtre académie changé : on recharge la liste des CAP correspondants. */
    async changerAcademieFiltre() {
      this.params.cap_id = ''
      this.capsFiltre = await capsService.listerPourSelect(this.params.academie_id || null).catch(() => [])
      this.filtrer()
    },

    // ------------------------------------------------ détail
    async ouvrirDetail(etab) {
      this.detail = { ouvert: true, chargement: true, erreur: '', donnees: null }
      try {
        this.detail.donnees = await etablissementsService.detail(etab.id)
      } catch (e) {
        this.detail.erreur = e.message
      } finally {
        this.detail.chargement = false
      }
    },

    // ------------------------------------------------ formulaire
    async ouvrirCreation() {
      const donnees = FORMULAIRE_VIDE()
      // Pré-remplissage selon le périmètre
      if (this.niveauPerimetre === 'academie') donnees.academie_id = this.perimetre.academie.id
      if (this.niveauPerimetre === 'cap') {
        donnees.ordre = 'fondamental'
        donnees.cap_id = this.perimetre.cap.id
      }
      this.formulaire = { ouvert: true, id: null, academie_id_temp: '', donnees, chargement: false, erreur: '', erreurs: {} }
      await this.chargerCapsFormulaire(this.perimetre?.academie?.id || null)
    },
    async ouvrirModification(etab) {
      const donnees = FORMULAIRE_VIDE()
      Object.keys(donnees).forEach((cle) => (donnees[cle] = etab[cle] ?? ''))
      // L'API renvoie series/filieres en objets ; le body attend des identifiants
      donnees.series = (etab.series || []).map((s) => s.id)
      donnees.filieres = (etab.filieres || []).map((f) => f.id)
      this.formulaire = { ouvert: true, id: etab.id, academie_id_temp: etab.academie_id || '', donnees, chargement: false, erreur: '', erreurs: {} }
      await this.chargerCapsFormulaire(etab.academie_id || null)
    },
    async chargerCapsFormulaire(academieId) {
      this.chargementCaps = true
      try {
        this.capsFormulaire = await capsService.listerPourSelect(academieId)
      } catch {
        this.capsFormulaire = []
      } finally {
        this.chargementCaps = false
      }
    },
    /** Changement d'ordre : on remet à zéro les champs qui dépendent de l'ordre (RG-1). */
    changerOrdre() {
      const d = this.formulaire.donnees
      d.cap_id = this.niveauPerimetre === 'cap' ? this.perimetre.cap.id : ''
      d.cycles = ''
      d.series = []
      d.filieres = []
      d.academie_id = this.niveauPerimetre === 'academie' ? this.perimetre.academie.id : ''
      if (!this.optionsStatutJuridiqueFormulaire.some((o) => o.valeur === d.statut_juridique)) d.statut_juridique = ''
    },
    /** Construit le body EtablissementEntree en respectant RG-1. */
    construireCorps() {
      const d = this.formulaire.donnees
      const corps = {
        code: d.code, nom: d.nom, ordre: d.ordre, statut_juridique: d.statut_juridique,
        localite: d.localite, telephone: d.telephone, directeur: d.directeur, nb_salles: d.nb_salles, statut: d.statut,
      }
      if (this.estFondamental) {
        corps.cap_id = d.cap_id
        corps.cycles = d.cycles
      } else {
        corps.academie_id = d.academie_id
        if (this.estLycee) corps.series = d.series
        else corps.filieres = d.filieres
      }
      // On n'envoie pas les chaînes vides (l'API applique ses défauts)
      return Object.fromEntries(Object.entries(corps).filter(([, v]) => v !== ''))
    },
    async enregistrer() {
      this.formulaire.chargement = true
      this.formulaire.erreur = ''
      this.formulaire.erreurs = {}
      const corps = this.construireCorps()
      try {
        if (this.formulaire.id) {
          await etablissementsService.modifier(this.formulaire.id, corps)
          this.succes = `Établissement ${corps.nom} modifié.`
        } else {
          await etablissementsService.creer(corps)
          this.succes = `Établissement ${corps.nom} créé.`
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
        const reponse = await etablissementsService.supprimer(this.confirmation.cible.id)
        this.succes = reponse?.message || 'Établissement supprimé ou désactivé.'
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

