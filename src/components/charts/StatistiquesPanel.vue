<!-- src/components/charts/StatistiquesPanel.vue -->
<template>
  <div v-if="stats" class="space-y-6">
    <section>
      <h3 class="text-[13px] font-semibold uppercase tracking-wider text-cnece-primary mb-3">
        <span class="inline-block w-2 h-2 rounded-full bg-cnece-primary mr-2"></span>Effectifs
      </h3>
      <EffectifsPanel :effectifs="{ ...stats.effectifs, annee_scolaire: stats.annee_scolaire }" />
    </section>

    <section v-if="stats.candidats" class="border-t border-slate-100 pt-6">
      <h3 class="text-[13px] font-semibold uppercase tracking-wider text-cnece-primary mb-3">
        <span class="inline-block w-2 h-2 rounded-full bg-cnece-primary mr-2"></span>Candidats aux examens
      </h3>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard libelle="Candidatures" :valeur="stats.candidats.total ?? 0" couleur="bleu" />
        <StatCard libelle="Réguliers" :valeur="stats.candidats.par_type?.regulier ?? 0" />
        <StatCard libelle="Libres" :valeur="stats.candidats.par_type?.libre ?? 0" couleur="ambre" />
        <StatCard libelle="En attente" :valeur="candidatsEnAttente" couleur="gris" sous-texte="à valider" />
      </div>
      <div class="grid md:grid-cols-2 gap-4">
        <BarChart titre="Par examen" :donnees="parExamen" couleur="bleu" vertical />
        <div>
          <p class="text-sm font-semibold text-slate-700 mb-2">Statut par examen</p>
          <table class="cnece-table">
            <thead><tr><th>Examen</th><th class="text-right">En attente</th><th class="text-right">Validés</th><th class="text-right">Rejetés</th><th class="text-right">Total</th></tr></thead>
            <tbody>
              <tr v-for="[examen, d] in Object.entries(stats.candidats.par_examen || {})" :key="examen">
                <td class="font-medium">{{ examen }}</td>
                <td class="text-right"><span class="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">{{ formaterNombre(d.par_statut?.en_attente ?? 0) }}</span></td>
                <td class="text-right"><span class="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">{{ formaterNombre(d.par_statut?.valide ?? 0) }}</span></td>
                <td class="text-right"><span class="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-semibold">{{ formaterNombre(d.par_statut?.rejete ?? 0) }}</span></td>
                <td class="text-right"><span class="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold">{{ formaterNombre(d.total ?? 0) }}</span></td>
              </tr>
              <tr v-if="!Object.keys(stats.candidats.par_examen || {}).length"><td colspan="5" class="text-center text-slate-500">Aucune candidature.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section v-if="stats.transferts" class="border-t border-slate-100 pt-6">
      <h3 class="text-[13px] font-semibold uppercase tracking-wider text-cnece-primary mb-3">
        <span class="inline-block w-2 h-2 rounded-full bg-cnece-primary mr-2"></span>Transferts
      </h3>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard libelle="Demandes" :valeur="stats.transferts.total ?? 0" couleur="bleu" />
        <StatCard libelle="En attente" :valeur="stats.transferts.par_statut?.en_attente ?? 0" couleur="ambre" />
        <StatCard libelle="Validés" :valeur="stats.transferts.par_statut?.valide ?? 0" />
        <StatCard libelle="Rejetés" :valeur="stats.transferts.par_statut?.rejete ?? 0" couleur="rouge" />
      </div>
    </section>
  </div>
</template>

<script>
import EffectifsPanel from './EffectifsPanel.vue'
import StatCard from './StatCard.vue'
import BarChart from './BarChart.vue'
import { formaterNombre } from '@/utils/format.js'

export default {
  name: 'StatistiquesPanel',
  components: { EffectifsPanel, StatCard, BarChart },
  props: {
    stats: { type: Object, default: null },
  },
  computed: {
    parExamen() {
      return Object.entries(this.stats.candidats?.par_examen || {}).map(([examen, d]) => ({ libelle: examen, valeur: d.total ?? 0 }))
    },
    candidatsEnAttente() {
      return Object.values(this.stats.candidats?.par_examen || {}).reduce((s, d) => s + (d.par_statut?.en_attente ?? 0), 0)
    },
  },
  methods: { formaterNombre },
}
</script>
