// src/components/index.js
// Enregistrement GLOBAL des composants communs : une fois branché dans main.js,
// chaque page peut écrire <AppTable>, <AppButton>… sans les importer une à une.
// (Les composants spécifiques à une page restent importés localement.)
import AppButton from './common/AppButton.vue'
import AppIconButton from './common/AppIconButton.vue'
import AppLoader from './common/AppLoader.vue'
import AppCard from './common/AppCard.vue'
import AppSteps from './common/AppSteps.vue'
import AppAlert from './common/AppAlert.vue'
import AppBadge from './common/AppBadge.vue'
import MatriculeBadge from './common/MatriculeBadge.vue'
import AppTable from './common/AppTable.vue'
import AppPagination from './common/AppPagination.vue'
import AppModal from './common/AppModal.vue'
import AppConfirmModal from './common/AppConfirmModal.vue'
import MotifRejetModal from './common/MotifRejetModal.vue'
import AppInput from './forms/AppInput.vue'
import AppSelect from './forms/AppSelect.vue'
import AppDatePicker from './forms/AppDatePicker.vue'
import EtablissementPicker from './forms/EtablissementPicker.vue'
import EtatCivilFields from './forms/EtatCivilFields.vue'
import InscriptionFields from './forms/InscriptionFields.vue'
import EleveSearchField from './forms/EleveSearchField.vue'
import StatCard from './charts/StatCard.vue'
import BarChart from './charts/BarChart.vue'
import EffectifsPanel from './charts/EffectifsPanel.vue'
import StatistiquesPanel from './charts/StatistiquesPanel.vue'

const composants = {
  AppButton,
  AppIconButton,
  AppLoader,
  AppCard,
  AppSteps,
  AppAlert,
  AppBadge,
  MatriculeBadge,
  AppTable,
  AppPagination,
  AppModal,
  AppConfirmModal,
  MotifRejetModal,
  AppInput,
  AppSelect,
  AppDatePicker,
  EtablissementPicker,
  EtatCivilFields,
  InscriptionFields,
  EleveSearchField,
  StatCard,
  BarChart,
  EffectifsPanel,
  StatistiquesPanel,
}

export default {
  // Un « plugin » Vue est simplement un objet avec une méthode install(app).
  install(app) {
    Object.entries(composants).forEach(([nom, composant]) => {
      app.component(nom, composant)
    })
  },
}
