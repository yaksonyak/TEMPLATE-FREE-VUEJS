<!-- src/components/common/MotifRejetModal.vue
     Modale de rejet partagée par les transferts et les candidatures :
     l'API exige un `motif_rejet` non vide (POST …/rejeter). -->
<template>
  <AppModal :ouvert="ouvert" :titre="titre" taille="sm" @fermer="fermer">
    <AppAlert v-if="erreur" type="erreur" :message="erreur" :erreurs="erreursChamps" class="mb-3" />
    <label for="motif_rejet" class="block text-sm font-medium text-slate-700 mb-1">
      Motif du rejet <span class="text-cnece-danger">*</span>
    </label>
    <textarea
      id="motif_rejet"
      v-model.trim="motif"
      rows="4"
      required
      class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cnece-accent focus:border-cnece-accent"
      placeholder="Ex. Dossier incomplet : extrait de naissance manquant."
    />
    <template #pied>
      <AppButton variante="outline" :disabled="chargement" @click="fermer">Annuler</AppButton>
      <AppButton variante="danger" :chargement="chargement" :disabled="!motif" @click="$emit('confirmer', motif)">
        Rejeter
      </AppButton>
    </template>
  </AppModal>
</template>

<script>
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'
import AppAlert from './AppAlert.vue'

export default {
  name: 'MotifRejetModal',
  components: { AppModal, AppButton, AppAlert },
  props: {
    ouvert: { type: Boolean, default: false },
    titre: { type: String, default: 'Rejeter' },
    chargement: { type: Boolean, default: false },
    erreur: { type: String, default: '' },
    erreursChamps: { type: Object, default: null },
  },
  emits: ['fermer', 'confirmer'],
  data() {
    return { motif: '' }
  },
  watch: {
    // À chaque ouverture, on repart d'un champ vide.
    ouvert(valeur) {
      if (valeur) this.motif = ''
    },
  },
  methods: {
    fermer() {
      this.$emit('fermer')
    },
  },
}
</script>
