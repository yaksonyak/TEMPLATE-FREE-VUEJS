<!-- src/views/statistiques/StatistiquesView.vue
     Objectif : consulter les statistiques de l'année active à un niveau choisi (national, académie, CAP,
     établissement) dans la limite du périmètre, et les exporter en Excel ou PDF (côté navigateur,
     l'API n'ayant pas d'endpoint d'export).
     Endpoints : GET /statistiques/national | academies/{id} | caps/{id} | etablissements/{id} ;
                 GET /academies, /caps, /etablissements pour les sélecteurs.
     Permissions : tous les rôles, dont consultation (statistiques agrégées uniquement). -->
<template>
  <div class="space-y-4">
    <AppCard titre="Statistiques" :sous-titre="stats ? `Année scolaire ${stats.annee_scolaire?.libelle || ''} — ${libellePerimetreStats}` : 'Choisissez un niveau'">
      <template #actions>
        <AppButton variante="outline" taille="sm" :disabled="!stats" @click="exporterExcel">Exporter Excel</AppButton>
        <AppButton variante="outline" taille="sm" :disabled="!stats" @click="exporterPDF">Exporter PDF</AppButton>
      </template>

      <!-- Sélection du niveau, bornée par le périmètre -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <AppSelect v-model="niveau" label="Niveau" :options="optionsNiveaux" @update:model-value="changerNiveau" />
        <AppSelect v-if="niveau !== 'national' && afficherAcademie" v-model="academieId" label="Académie" :options="academies" cle-valeur="id" cle-libelle="nom" numerique
                   :chargement="chargementListes" @update:model-value="changerAcademie" />
        <AppSelect v-if="['cap', 'etablissement'].includes(niveau) && afficherCap" v-model="capId" :label="niveau === 'cap' ? 'CAP' : 'CAP (écoles fondamentales)'" :options="caps" cle-valeur="id" cle-libelle="nom" numerique
                   :chargement="chargementListes" :placeholder="niveau === 'cap' ? '— Sélectionner —' : 'Lycées et techniques'" @update:model-value="changerCap" />
        <AppSelect v-if="niveau === 'etablissement' && niveauPerimetre !== 'etablissement'" v-model="etablissementId" label="Établissement" :options="etablissements" cle-valeur="id" cle-libelle="nom" numerique
                   :chargement="chargementListes" @update:model-value="charger" />
      </div>
    </AppCard>

    <p v-if="chargement" class="text-sm text-slate-500">Chargement des statistiques…</p>
    <AppAlert v-else-if="erreur" type="erreur" :message="erreur" />
    <AppCard v-else-if="stats">
      <StatistiquesPanel :stats="stats" />
    </AppCard>
    <AppCard v-else><p class="text-sm text-slate-500">Sélectionnez un élément pour afficher ses statistiques.</p></AppCard>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import statistiquesService from '@/services/statistiques.service.js'
import academiesService from '@/services/academies.service.js'
import capsService from '@/services/caps.service.js'
import etablissementsService from '@/services/etablissements.service.js'
import { useAuthStore } from '@/stores/auth.js'
import { exporterExcel, exporterPDF } from '@/utils/export.js'
import { libelle, libelleNiveau } from '@/utils/format.js'

const ORDRE_NIVEAUX = ['national', 'academie', 'cap', 'etablissement']
const LIBELLES_NIVEAUX = { national: 'National', academie: 'Académie', cap: 'CAP', etablissement: 'Établissement' }

export default {
  name: 'StatistiquesView',

  data() {
    return {
      niveau: '',
      academieId: '',
      capId: '',
      etablissementId: '',
      academies: [],
      caps: [],
      etablissements: [],
      chargementListes: false,
      chargement: false,
      erreur: '',
      stats: null,
    }
  },

  computed: {
    ...mapState(useAuthStore, ['perimetre', 'niveauPerimetre']),
    /** Niveaux accessibles : du niveau de mon périmètre vers le bas. consultation = national. */
    optionsNiveaux() {
      const depart = this.niveauPerimetre === 'consultation' ? 0 : ORDRE_NIVEAUX.indexOf(this.niveauPerimetre)
      return ORDRE_NIVEAUX.slice(Math.max(0, depart)).map((n) => ({ valeur: n, libelle: LIBELLES_NIVEAUX[n] }))
    },
    afficherAcademie() {
      return ['national', 'consultation'].includes(this.niveauPerimetre)
    },
    afficherCap() {
      return ['national', 'consultation', 'academie'].includes(this.niveauPerimetre)
    },
    libellePerimetreStats() {
      const s = this.stats
      if (!s) return ''
      return s.etablissement?.nom || s.cap?.nom || s.academie?.nom || 'Tout le territoire'
    },
  },

  async created() {
    // Point de départ : mon propre périmètre
    this.niveau = this.optionsNiveaux[0].valeur
    if (this.perimetre?.academie) this.academieId = this.perimetre.academie.id
    if (this.perimetre?.cap) this.capId = this.perimetre.cap.id
    if (this.perimetre?.etablissement) this.etablissementId = this.perimetre.etablissement.id
    if (this.afficherAcademie) academiesService.listerPourSelect().then((a) => (this.academies = a)).catch(() => {})
    this.charger()
  },

  methods: {
    // ------------------------------------------------ sélection
    changerNiveau() {
      this.stats = null
      this.erreur = ''
      if (this.niveau === 'national') return this.charger()
      if (this.niveau === 'academie' && this.academieId) return this.charger()
      if (['cap', 'etablissement'].includes(this.niveau) && this.academieId) this.chargerCaps()
      if (this.niveau === 'etablissement') this.chargerEtablissements()
      if (this.niveau === 'cap' && this.capId) this.charger()
      if (this.niveau === 'etablissement' && this.etablissementId) this.charger()
    },
    changerAcademie() {
      this.capId = ''
      this.etablissementId = ''
      this.stats = null
      if (this.niveau === 'academie') return this.charger()
      this.chargerCaps()
      if (this.niveau === 'etablissement') this.chargerEtablissements()
    },
    changerCap() {
      this.etablissementId = ''
      this.stats = null
      if (this.niveau === 'cap') return this.charger()
      this.chargerEtablissements()
    },
    async chargerCaps() {
      this.chargementListes = true
      this.caps = await capsService.listerPourSelect(this.academieId || null).catch(() => [])
      this.chargementListes = false
    },
    async chargerEtablissements() {
      this.chargementListes = true
      const filtres = this.capId ? { cap_id: this.capId } : this.academieId ? { academie_id: this.academieId } : {}
      this.etablissements = await etablissementsService.listerPourSelect(filtres).catch(() => [])
      this.chargementListes = false
    },

    // ------------------------------------------------ chargement
    async charger() {
      const id = { academie: this.academieId, cap: this.capId, etablissement: this.etablissementId }[this.niveau]
      if (this.niveau !== 'national' && !id) return
      this.chargement = true
      this.erreur = ''
      try {
        this.stats = this.niveau === 'national' ? await statistiquesService.national() : await statistiquesService[this.niveau](id)
      } catch (e) {
        this.stats = null
        this.erreur = e.statut === 403 ? 'Ces statistiques sont hors de votre périmètre.' : e.message
      } finally {
        this.chargement = false
      }
    },

    // ------------------------------------------------ exports
    /** Transforme l'objet Statistiques en tableaux simples (colonnes + lignes) pour Excel et PDF. */
    construireTableaux() {
      const s = this.stats
      const e = s.effectifs || {}
      const tableaux = []
      tableaux.push({
        titre: 'Synthèse',
        colonnes: ['Indicateur', 'Valeur'],
        lignes: [
          ['Périmètre', this.libellePerimetreStats],
          ['Année scolaire', s.annee_scolaire?.libelle || ''],
          ['Élèves inscrits', e.eleves ?? e.total ?? 0],
          ['Établissements', e.etablissements ?? ''],
          ['Filles', e.par_genre?.F ?? 0],
          ['Garçons', e.par_genre?.M ?? 0],
          ['Candidatures', s.candidats?.total ?? 0],
          ['Transferts', s.transferts?.total ?? 0],
        ],
      })
      if (e.par_ordre) tableaux.push({ titre: 'Élèves par ordre', colonnes: ['Ordre', 'Élèves'], lignes: Object.entries(e.par_ordre).map(([k, v]) => [libelle('ordre', k), v]) })
      if (e.par_statut_juridique) tableaux.push({ titre: 'Par statut juridique', colonnes: ['Statut juridique', 'Élèves'], lignes: Object.entries(e.par_statut_juridique).map(([k, v]) => [libelle('statut_juridique', k), v]) })
      if (e.par_niveau) {
        const lignes = Array.isArray(e.par_niveau)
          ? e.par_niveau.map((x) => ['', libelleNiveau(x.niveau), x.total])
          : Object.entries(e.par_niveau).flatMap(([ordre, liste]) => (liste || []).map((x) => [libelle('ordre', ordre), libelleNiveau(x.niveau), x.total]))
        tableaux.push({ titre: 'Élèves par niveau', colonnes: ['Ordre', 'Niveau', 'Élèves'], lignes })
      }
      if (e.par_serie) tableaux.push({ titre: 'Par série', colonnes: ['Série', 'Élèves'], lignes: Object.entries(e.par_serie) })
      if (e.par_filiere) tableaux.push({ titre: 'Par filière', colonnes: ['Filière', 'Élèves'], lignes: Object.entries(e.par_filiere) })
      if (s.candidats?.par_examen) {
        tableaux.push({
          titre: 'Candidats par examen',
          colonnes: ['Examen', 'Total', 'Réguliers', 'Libres', 'En attente', 'Validés', 'Rejetés'],
          lignes: Object.entries(s.candidats.par_examen).map(([ex, d]) => [ex, d.total ?? 0, d.regulier ?? 0, d.libre ?? 0, d.par_statut?.en_attente ?? 0, d.par_statut?.valide ?? 0, d.par_statut?.rejete ?? 0]),
        })
      }
      if (s.transferts?.par_statut) {
        tableaux.push({ titre: 'Transferts', colonnes: ['Statut', 'Nombre'], lignes: Object.entries(s.transferts.par_statut).map(([k, v]) => [libelle('statut_validation', k), v]) })
      }
      return tableaux
    },
    exporterExcel() {
      exporterExcel(`statistiques ${this.libellePerimetreStats}`, this.construireTableaux())
    },
    exporterPDF() {
      exporterPDF(`statistiques ${this.libellePerimetreStats}`, 'Statistiques', `${this.libellePerimetreStats} · ${this.stats.annee_scolaire?.libelle || ''}`, this.construireTableaux())
    },
  },
}
</script>
