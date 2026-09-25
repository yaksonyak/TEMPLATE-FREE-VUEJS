<!-- src/views/eleves/RechercheNationaleView.vue
     Objectif : retrouver n'importe quel élève du pays par son matricule exact,
     même hors du périmètre de l'utilisateur (accueil d'un transfert, vérification d'un doublon).
     Endpoint : GET /eleves/recherche?matricule=AAEECCNNNL → élève avec historique, 404 si inconnu.
     Permissions : rôles de gestion (pas consultation). La fiche complète (GET /eleves/{id})
     reste soumise au périmètre : le lien n'est proposé que si l'élève est dans le périmètre. -->
<template>
  <div class="max-w-3xl mx-auto space-y-4">
    <AppCard titre="Recherche nationale par matricule" sous-titre="Format : AAEECCNNNL — ex. 260312045K (année, académie, CAP, séquence, lettre)">
      <form class="flex flex-col sm:flex-row gap-3" @submit.prevent="rechercher">
        <div class="flex-1">
          <label for="matricule" class="sr-only">Matricule</label>
          <input
            id="matricule"
            v-model.trim="matricule"
            type="search"
            maxlength="10"
            autocomplete="off"
            placeholder="Saisir les 10 caractères du matricule"
            class="w-full font-mono uppercase tracking-widest text-lg rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cnece-accent"
            :class="erreurFormat ? 'border-cnece-danger' : 'border-slate-300'"
            @input="matricule = matricule.toUpperCase()"
          />
          <p v-if="erreurFormat" class="mt-1 text-xs text-cnece-danger">{{ erreurFormat }}</p>
        </div>
        <AppButton type="submit" :chargement="chargement" :disabled="matricule.length !== 10">Rechercher</AppButton>
      </form>
    </AppCard>

    <AppAlert v-if="erreur" :type="statutErreur === 404 ? 'avertissement' : 'erreur'" :message="erreur" />

    <!-- Résultat -->
    <AppCard v-if="eleve" :titre="`${eleve.prenom} ${eleve.nom}`" sous-titre="Élève trouvé dans le registre national">
      <template #actions>
        <MatriculeBadge :matricule="eleve.matricule" />
        <AppBadge :valeur="eleve.statut" famille="statut" />
      </template>

      <dl class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-5">
        <div><dt class="text-slate-500">Sexe</dt><dd class="font-medium">{{ libelle('sexe', eleve.sexe) }}</dd></div>
        <div><dt class="text-slate-500">Né(e) le</dt><dd class="font-medium">{{ formaterDate(eleve.date_naissance) }}</dd></div>
        <div><dt class="text-slate-500">Lieu</dt><dd class="font-medium">{{ eleve.lieu_naissance || '—' }}</dd></div>
        <div><dt class="text-slate-500">Acte de naissance</dt><dd class="font-medium">{{ eleve.numero_acte_naissance || '—' }}</dd></div>
      </dl>

      <h3 class="text-sm font-semibold text-slate-700 mb-2">Parcours scolaire</h3>
      <AppTable :colonnes="colonnesInscriptions" :lignes="eleve.inscriptions || []" message-vide="Aucune inscription connue.">
        <template #cellule-niveau="{ valeur }">{{ libelleNiveau(valeur) }}</template>
        <template #cellule-statut="{ valeur }"><AppBadge :valeur="valeur" famille="statut_inscription" /></template>
      </AppTable>

      <template #pied>
        <div class="flex items-center justify-between gap-3 text-sm">
          <p class="text-slate-500">
            Dernier établissement : <span class="font-medium text-slate-700">{{ dernierEtablissement }}</span>
          </p>
          <router-link :to="{ name: 'eleve-detail', params: { id: eleve.id } }" class="btn-primary text-sm">
            Ouvrir la fiche complète
          </router-link>
        </div>
      </template>
    </AppCard>
  </div>
</template>

<script>
import elevesService from '@/services/eleves.service.js'
import { formaterDate, libelle, libelleNiveau } from '@/utils/format.js'

const FORMAT_MATRICULE = /^\d{9}[A-Z]$/ // AA EE CC NNN L : 9 chiffres + 1 lettre

export default {
  name: 'RechercheNationaleView',
  data() {
    return {
      matricule: this.$route.query.matricule || '',
      chargement: false,
      erreur: '',
      statutErreur: null,
      eleve: null,
      colonnesInscriptions: [
        { cle: 'annee_scolaire.libelle', libelle: 'Année', classe: 'w-28' },
        { cle: 'etablissement.nom', libelle: 'Établissement' },
        { cle: 'niveau', libelle: 'Niveau', classe: 'w-24' },
        { cle: 'serie.code', libelle: 'Série', classe: 'w-20' },
        { cle: 'filiere.code', libelle: 'Filière', classe: 'w-24' },
        { cle: 'statut', libelle: 'Statut', classe: 'w-28' },
        { cle: 'date_inscription', libelle: 'Inscrit le', classe: 'w-28', format: formaterDate },
      ],
    }
  },
  computed: {
    erreurFormat() {
      if (this.matricule.length === 10 && !FORMAT_MATRICULE.test(this.matricule)) {
        return 'Format attendu : 9 chiffres puis une lettre (ex. 260312045K).'
      }
      return ''
    },
    dernierEtablissement() {
      const insc = this.eleve?.inscription_active || this.eleve?.inscriptions?.[0]
      return insc?.etablissement?.nom || '—'
    },
  },
  created() {
    // Arrivée avec ?matricule=… (ex. depuis la page des candidats) : recherche immédiate
    if (this.matricule.length === 10) this.rechercher()
  },
  methods: {
    formaterDate,
    libelle,
    libelleNiveau,
    async rechercher() {
      if (this.erreurFormat) return
      this.chargement = true
      this.erreur = ''
      this.eleve = null
      try {
        this.eleve = await elevesService.rechercherParMatricule(this.matricule)
      } catch (e) {
        this.statutErreur = e.statut
        this.erreur = e.statut === 404 ? `Aucun élève ne porte le matricule ${this.matricule}.` : e.message
      } finally {
        this.chargement = false
      }
    },
  },
}
</script>
