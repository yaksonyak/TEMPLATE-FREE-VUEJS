<!-- src/views/auth/LoginView.vue
     Page de connexion. Objectif : récupérer un jeton via POST /auth/connexion
     (à travers le store auth) puis rediriger vers la page demandée ou le tableau de bord.
     Règle de permission : page publique (meta.public) ; un utilisateur déjà connecté
     est renvoyé vers l'accueil par la garde du router.
     Habillage : mise en page deux colonnes (visuel + formulaire) entièrement gérée ici ;
     layouts/AuthLayout.vue ne fournit plus qu'un conteneur neutre. -->
<template>
  <div class="grid h-screen lg:grid-cols-2">
    <!-- ===================== COLONNE GAUCHE : visuel de présentation (masquée sur mobile) ===================== -->
    <!-- h-full + overflow-hidden : ce panneau ne doit jamais provoquer de défilement, il s'adapte à la hauteur de l'écran -->
    <div class="relative hidden h-full overflow-hidden bg-slate-950 lg:block">
      <div class="relative flex h-full flex-col p-12">
        <!-- En-tête de présentation -->
        <div>
          <div class="flex h-1.5 w-24 overflow-hidden rounded-full" aria-hidden="true">
            <span class="flex-1 bg-brand-green"></span>
            <span class="flex-1 bg-brand-gold"></span>
            <span class="flex-1 bg-brand-red"></span>
          </div>
          <div class="mt-6 flex items-center gap-4">
            <div class="text-white/90">
              <p class="text-xs font-semibold uppercase tracking-widest">Application Vue.js</p>
              <p class="text-[11px] italic text-white/70">Architecture front-end prête à personnaliser</p>
            </div>
          </div>
        </div>

        <div class="flex min-h-0 flex-1 items-center justify-center py-6">
          <img
            src="@/assets/login-demo.jpg"
            alt="Portrait d’un jeune homme souriant"
            class="aspect-square h-auto max-h-full w-full max-w-[min(100%,640px)] rounded-2xl object-contain shadow-2xl"
          />
        </div>

        <div class="text-white">
          <h1 class="text-3xl font-bold leading-tight">Votre application, prête à évoluer</h1>
          <p class="mt-3 max-w-sm text-sm text-white/85">
            Une base front-end organisée pour construire votre projet et le connecter à votre API.
          </p>
        </div>
      </div>
    </div>

    <!-- ===================== COLONNE DROITE : formulaire de connexion ===================== -->
    <!-- h-full + overflow-y-auto : si le formulaire dépasse la hauteur de l'écran,
         seule cette colonne défile ; la page entière ne défile jamais. -->
    <div class="flex h-full items-center justify-center overflow-y-auto bg-white px-6 py-12 sm:px-10">
      <div class="w-full max-w-md">
        <!-- En-tête : logo + titre institutionnel (le titre plein n'est répété qu'en absence de la colonne visuelle) -->
        <div class="mb-8 text-center">
          <div
            class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cnece-primary text-xl font-bold text-white"
            aria-hidden="true"
          >
            V
          </div>
          <h1 class="text-xl font-bold text-slate-800 lg:hidden">Application Vue.js</h1>
          <p class="mt-1 text-sm text-slate-500">Espace de gestion scolaire</p>
        </div>

        <!-- Carte du formulaire -->
        <div class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
          <!-- Liseré décoratif -->
          <div class="flex h-1.5" aria-hidden="true">
            <span class="flex-1 bg-brand-green"></span>
            <span class="flex-1 bg-brand-gold"></span>
            <span class="flex-1 bg-brand-red"></span>
          </div>

          <div class="p-8">
            <h2 class="text-lg font-semibold text-slate-800 mb-6">Connexion</h2>

            <!-- Message d'erreur global (401, 403 compte désactivé, réseau…) -->
            <div
              v-if="erreur"
              role="alert"
              class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-cnece-danger"
            >
              {{ erreur }}
            </div>

            <!-- @submit.prevent : empêche le rechargement de la page par le navigateur -->
            <form @submit.prevent="soumettre" novalidate class="space-y-5">
              <div>
                <label for="email" class="block text-sm font-medium text-slate-700 mb-1">
                  Adresse e-mail
                </label>
                <input
                  id="email"
                  v-model.trim="formulaire.email"
                  type="email"
                  autocomplete="username"
                  required
                  :aria-invalid="Boolean(erreursChamps.email)"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cnece-accent focus:border-cnece-accent"
                  placeholder="prenom.nom@exemple.com"
                />
                <!-- Erreur 422 spécifique au champ, renvoyée par l'API -->
                <p v-if="erreursChamps.email" class="mt-1 text-xs text-cnece-danger">
                  {{ erreursChamps.email[0] }}
                </p>
              </div>

              <div>
                <label for="mot_de_passe" class="block text-sm font-medium text-slate-700 mb-1">
                  Mot de passe
                </label>
                <div class="relative">
                  <input
                    id="mot_de_passe"
                    v-model="formulaire.motDePasse"
                    :type="afficherMotDePasse ? 'text' : 'password'"
                    autocomplete="current-password"
                    required
                    :aria-invalid="Boolean(erreursChamps.mot_de_passe)"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-cnece-accent focus:border-cnece-accent"
                  />
                  <button
                    type="button"
                    class="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-500 hover:text-slate-700"
                    @click="afficherMotDePasse = !afficherMotDePasse"
                  >
                    {{ afficherMotDePasse ? 'Masquer' : 'Afficher' }}
                  </button>
                </div>
                <p v-if="erreursChamps.mot_de_passe" class="mt-1 text-xs text-cnece-danger">
                  {{ erreursChamps.mot_de_passe[0] }}
                </p>
              </div>

              <button
                type="submit"
                class="btn-primary w-full"
                :disabled="chargement || !formulaireValide"
              >
                <span v-if="chargement">Connexion en cours…</span>
                <span v-else>Se connecter</span>
              </button>
            </form>
          </div>
        </div>

        <p class="mt-6 text-center text-xs text-slate-400">
          Connectez-vous pour accéder à votre espace de travail.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'

const MODE_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

export default {
  name: 'LoginView',

  data() {
    return {
      formulaire: {
        email: MODE_DEMO ? 'admin@example.com' : '',
        motDePasse: MODE_DEMO ? 'votre_mot_de_passe' : '',
      },
      afficherMotDePasse: false,
      erreur: null,          // message global
      erreursChamps: {},     // { email: [...], mot_de_passe: [...] } en cas de 422
    }
  },

  computed: {
    // Relie state.chargement du store à this.chargement dans le composant
    ...mapState(useAuthStore, ['chargement']),

    /** Le bouton reste désactivé tant que les deux champs ne sont pas remplis. */
    formulaireValide() {
      return this.formulaire.email.length > 0 && this.formulaire.motDePasse.length > 0
    },
  },

  methods: {
    // Relie l'action login du store à this.login
    ...mapActions(useAuthStore, ['login']),

    async soumettre() {
      this.erreur = null
      this.erreursChamps = {}
      try {
        await this.login(this.formulaire.email, this.formulaire.motDePasse)
        // Si la garde nous a envoyés ici avec ?redirection=/eleves, on y retourne.
        const destination = this.$route.query.redirection || { name: 'tableau-de-bord' }
        this.$router.replace(destination)
      } catch (e) {
        // e = { statut, message, erreurs } construit par api.js
        this.erreur = e.message
        this.erreursChamps = e.erreurs || {}
      }
    },
  },
}
</script>
