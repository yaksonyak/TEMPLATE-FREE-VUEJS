<!-- src/views/eleves/ElevesListView.vue
     Objectif : parcourir les élèves du périmètre avec filtres et pagination serveur.
     Endpoints : GET /eleves (etablissement_id, cap_id, academie_id, niveau, sexe, statut,
                 annee_scolaire_id, recherche, tri, ordre) ; GET /annees-scolaires pour le filtre année.
     Permissions : rôles de gestion (403 pour consultation, route protégée) ;
     bouton « Nouvel élève » via canEdit('eleves'). Un clic sur une ligne ouvre la fiche. -->
<template>
  <div class="space-y-4">
    <AppCard titre="Élèves" :sous-titre="`${pagination.total} élève(s) dans votre périmètre`" sans-marge>
      <template #actions>
        <AppButton variante="outline" taille="sm" @click="reinitialiser">Réinitialiser</AppButton>
        <AppButton variante="outline" taille="sm" :disabled="!elements.length" @click="exporter('excel')">Excel</AppButton>
        <AppButton variante="outline" taille="sm" :disabled="!elements.length" @click="exporter('pdf')">PDF</AppButton>
        <AppButton v-if="peutEditer" taille="sm" @click="$router.push({ name: 'eleve-nouveau' })">+ Nouvelle inscription</AppButton>
      </template>

      <!-- Filtres -->
      <div class="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
        <EtablissementPicker v-model="params.etablissement_id" label="Établissement" @update:model-value="filtrer" />
        <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select v-model="params.niveau" aria-label="Niveau" class="champ-filtre" @change="filtrer">
            <option value="">Tous niveaux</option>
            <option v-for="n in 12" :key="n" :value="n">{{ libelleNiveau(n) }}</option>
          </select>
          <select v-model="params.sexe" aria-label="Sexe" class="champ-filtre" @change="filtrer">
            <option value="">Filles et garçons</option>
            <option value="F">Filles</option>
            <option value="M">Garçons</option>
          </select>
          <select v-model="params.statut" aria-label="Statut" class="champ-filtre" @change="filtrer">
            <option value="">Actifs et inactifs</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
          </select>
          <select v-model="params.annee_scolaire_id" aria-label="Année scolaire" class="champ-filtre" @change="filtrer">
            <option value="">Année active</option>
            <option v-for="a in annees" :key="a.id" :value="a.id">{{ a.libelle }}</option>
          </select>
          <input v-model="params.recherche" type="search" placeholder="Matricule, nom, prénom…" aria-label="Rechercher" class="champ-filtre" />
        </div>
      </div>

      <AppTable :colonnes="colonnes" :lignes="elements" :chargement="chargement" :erreur="erreur"
                :tri="params.tri" :ordre="params.ordre" cliquable
                message-vide="Aucun élève ne correspond aux filtres." @trier="trier" @reessayer="charger" @ligne-cliquee="ouvrirFiche">
        <template #cellule-matricule="{ valeur }"><MatriculeBadge :matricule="valeur" /></template>
        <template #cellule-nom="{ ligne }">
          <span class="font-medium text-slate-800">{{ ligne.nom }}</span> {{ ligne.prenom }}
        </template>
        <template #cellule-sexe="{ valeur }">
          <span :class="valeur === 'F' ? 'text-pink-600' : 'text-blue-600'">{{ valeur }}</span>
        </template>
        <!-- Nom de slot dynamique : un point dans #cellule-x.y serait lu comme un modificateur -->
        <template #[`cellule-inscription_active.statut`]="{ valeur }">
          <AppBadge v-if="valeur" :valeur="valeur" famille="statut_inscription" />
          <span v-else class="text-xs text-slate-400">Non inscrit</span>
        </template>
        <template #cellule-statut="{ valeur }"><AppBadge :valeur="valeur" famille="statut" /></template>
        <template #actions="{ ligne }">
          <AppButton variante="outline" taille="sm" @click="ouvrirFiche(ligne)">Fiche</AppButton>
        </template>
      </AppTable>

      <template #pied>
        <AppPagination :pagination="pagination" @changer-page="changerPage" @changer-taille="changerTaille" />
      </template>
    </AppCard>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import listeApi from '@/mixins/listeApi.js'
import elevesService from '@/services/eleves.service.js'
import referentielsService from '@/services/referentiels.service.js'
import { useAuthStore } from '@/stores/auth.js'
import { canEdit } from '@/utils/permissions.js'
import { formaterDate, libelle, libelleNiveau } from '@/utils/format.js'
import { exporterExcel, exporterPDF } from '@/utils/export.js'

export default {
  name: 'ElevesListView',
  mixins: [listeApi],

  data() {
    return {
      colonnes: [
        { cle: 'matricule', libelle: 'Matricule', triable: true, classe: 'w-36' },
        { cle: 'nom', libelle: 'Nom et prénom', triable: true },
        { cle: 'sexe', libelle: 'Sexe', triable: true, classe: 'w-16' },
        { cle: 'date_naissance', libelle: 'Né(e) le', triable: true, classe: 'w-28', format: formaterDate },
        { cle: 'inscription_active.etablissement.nom', libelle: 'Établissement' },
        { cle: 'inscription_active.niveau', libelle: 'Niveau', classe: 'w-20', format: (v) => (v ? libelleNiveau(v) : '—') },
        { cle: 'inscription_active.statut', libelle: 'Inscription', classe: 'w-28' },
        { cle: 'statut', libelle: 'Statut', triable: true, classe: 'w-24' },
      ],
      annees: [],
    }
  },

  computed: {
    ...mapState(useAuthStore, ['role']),
    peutEditer() {
      return canEdit('eleves', this.role)
    },
  },

  async created() {
    this.annees = (await referentielsService.listerAnneesScolaires({ par_page: 100, tri: 'libelle', ordre: 'desc' }).catch(() => ({ elements: [] }))).elements
  },

  methods: {
    libelleNiveau,
    filtresInitiaux() {
      return { etablissement_id: '', niveau: '', sexe: '', statut: '', annee_scolaire_id: '' }
    },
    chargerElements(params) {
      return elevesService.lister(params)
    },
    ouvrirFiche(eleve) {
      this.$router.push({ name: 'eleve-detail', params: { id: eleve.id } })
    },
    /** Exporte la PAGE affichée (filtres appliqués). Pour tout exporter : par_page = 100 puis page par page. */
    exporter(format) {
      const tableau = {
        titre: 'Élèves',
        colonnes: ['Matricule', 'Nom', 'Prénom', 'Sexe', 'Né(e) le', 'Lieu', 'Établissement', 'Niveau', 'Inscription', 'Statut'],
        lignes: this.elements.map((e) => [
          e.matricule, e.nom, e.prenom, e.sexe, formaterDate(e.date_naissance), e.lieu_naissance,
          e.inscription_active?.etablissement?.nom, e.inscription_active ? libelleNiveau(e.inscription_active.niveau) : '',
          libelle('statut_inscription', e.inscription_active?.statut), libelle('statut', e.statut),
        ]),
      }
      const sousTitre = `${this.pagination.total} élève(s) — page ${this.pagination.page}/${this.pagination.total_pages}`
      if (format === 'excel') exporterExcel('eleves', [tableau])
      else exporterPDF('eleves', 'Liste des élèves', sousTitre, [tableau])
    },
  },
}
</script>
