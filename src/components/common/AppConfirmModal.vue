<!-- src/components/common/AppConfirmModal.vue
     Demande de confirmation (valider, désactiver, supprimer…).
     Émet `confirmer` ; le parent fait l'appel API et ferme la modale. -->
<template>
  <AppModal :ouvert="ouvert" :titre="titre" taille="sm" @fermer="$emit('fermer')">
    <p class="text-sm text-slate-700">
      <slot>{{ message }}</slot>
    </p>
    <template #pied>
      <AppButton variante="outline" :disabled="chargement" @click="$emit('fermer')">Annuler</AppButton>
      <AppButton :variante="variante" :chargement="chargement" @click="$emit('confirmer')">
        {{ libelleConfirmer }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script>
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'

export default {
  name: 'AppConfirmModal',
  components: { AppModal, AppButton },
  props: {
    ouvert: { type: Boolean, default: false },
    titre: { type: String, default: 'Confirmer' },
    message: { type: String, default: 'Voulez-vous vraiment effectuer cette action ?' },
    libelleConfirmer: { type: String, default: 'Confirmer' },
    variante: { type: String, default: 'primary' }, // 'danger' pour les actions destructrices
    chargement: { type: Boolean, default: false },
  },
  emits: ['fermer', 'confirmer'],
}
</script>
