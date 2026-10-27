<!-- Trace des actions sensibles realisees par les administrateurs. -->
<script setup>
const filters = reactive({ action: null, search: '', from: null, to: null })

// Familles d'actions : l'API filtre sur le prefixe du code.
const actionItems = [
  { value: 'demande_annonceur', title: 'Demandes annonceur' },
  { value: 'statut_offre', title: 'Modération des annonces' },
  { value: 'statut_utilisateur', title: 'Blocage / déblocage de comptes' },
  { value: 'suppression_utilisateur', title: 'Suppressions de comptes' },
]

const resetFilters = () => { filters.action = null }

const { items: entries, total, isLoading, options, load } = usePagedList('/admin/history', filters, 'Le journal n\'a pas pu être chargé.')

/**
 * L'API enregistre des codes d'action (statut_offre_validee...). Ils sont
 * traduits ici ; un code inconnu reste affiche tel quel.
 */
const ACTIONS = {
  statut_offre_validee: { label: 'Annonce validée', color: 'success', icon: 'tabler-home-check' },
  statut_offre_refusee: { label: 'Annonce refusée', color: 'error', icon: 'tabler-home-x' },
  statut_offre_en_attente: { label: 'Annonce remise en attente', color: 'warning', icon: 'tabler-clock' },
  demande_annonceur_acceptee: { label: 'Demande annonceur acceptée', color: 'success', icon: 'tabler-building-estate' },
  demande_annonceur_refusee: { label: 'Demande annonceur refusée', color: 'error', icon: 'tabler-building-estate' },
  statut_utilisateur_bloque: { label: 'Compte bloqué', color: 'error', icon: 'tabler-lock' },
  statut_utilisateur_actif: { label: 'Compte débloqué', color: 'success', icon: 'tabler-lock-open' },
  suppression_utilisateur: { label: 'Compte supprimé', color: 'error', icon: 'tabler-trash' },
}

const actionOf = code => ACTIONS[code] ?? { label: code, color: 'secondary', icon: 'tabler-point' }

const headers = [
  { title: 'Action', key: 'action', sortable: false },
  { title: 'Détail', key: 'description', sortable: false },
  { title: 'Administrateur', key: 'admin', sortable: false },
  { title: 'Date', key: 'created_at', sortable: false },
]
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-6">
      <div>
        <h4 class="text-h4 mb-1">
          Journal des actions
        </h4>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Historique des décisions prises par les administrateurs
        </p>
      </div>
      <VBtn
        variant="tonal"
        prepend-icon="tabler-refresh"
        :loading="isLoading"
        @click="load"
      >
        Actualiser
      </VBtn>
    </div>

    <VCard>
      <ListFilters
        v-model:search="filters.search"
        v-model:from="filters.from"
        v-model:to="filters.to"
        search-placeholder="Rechercher dans le détail..."
        with-period
        :active="!!filters.action"
        @reset="resetFilters"
      >
        <VCol
          cols="12"
          md="4"
        >
          <AppSelect
            v-model="filters.action"
            :items="actionItems"
            placeholder="Toutes les actions"
            clearable
          />
        </VCol>
      </ListFilters>

      <VDivider />

      <VDataTableServer
        v-model:page="options.page"
        :items-per-page="options.itemsPerPage"
        :headers="headers"
        :items="entries"
        :items-length="total"
        :loading="isLoading"
        no-data-text="Aucune action enregistrée"
        loading-text="Chargement..."
      >
        <template #item.action="{ item }">
          <div class="d-flex align-center gap-3 py-2 text-no-wrap">
            <VAvatar
              size="32"
              variant="tonal"
              :color="actionOf(item.action).color"
            >
              <VIcon
                :icon="actionOf(item.action).icon"
                size="18"
              />
            </VAvatar>
            <span class="font-weight-medium">{{ actionOf(item.action).label }}</span>
          </div>
        </template>

        <template #item.description="{ item }">
          {{ item.description ?? '—' }}
        </template>

        <template #item.admin="{ item }">
          {{ item.admin?.name ?? '—' }}
        </template>

        <template #item.created_at="{ item }">
          <span class="text-no-wrap">{{ formatDateTime(item.created_at) }}</span>
        </template>

        <template #bottom>
          <TablePagination
            v-model:page="options.page"
            :items-per-page="options.itemsPerPage"
            :total-items="total"
          />
        </template>
      </VDataTableServer>
    </VCard>
  </div>
</template>
