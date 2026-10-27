<!-- Paiements des visites 3D effectues par les clients. -->
<script setup>
const filters = reactive({ status: null, search: '', from: null, to: null })

const statusItems = statusOptions('payment')

const resetFilters = () => { filters.status = null }

const { items: payments, total, isLoading, options, load } = usePagedList('/admin/payments', filters, 'Les paiements n\'ont pas pu être chargés.')

const headers = [
  { title: 'Référence', key: 'provider_reference', sortable: false },
  { title: 'Client', key: 'user', sortable: false },
  { title: 'Annonce', key: 'property', sortable: false },
  { title: 'Montant', key: 'amount', sortable: false },
  { title: 'Moyen', key: 'provider', sortable: false },
  { title: 'Date', key: 'created_at', sortable: false },
  { title: 'Statut', key: 'status', sortable: false },
]
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-6">
      <div>
        <h4 class="text-h4 mb-1">
          Paiements
        </h4>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Déblocages de visites 3D payés par les clients
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
        search-placeholder="Référence, client, annonce..."
        with-period
        :active="!!filters.status"
        @reset="resetFilters"
      >
        <VCol
          cols="12"
          md="4"
        >
          <AppSelect
            v-model="filters.status"
            :items="statusItems"
            placeholder="Tous les statuts"
            clearable
          />
        </VCol>
      </ListFilters>

      <VDivider />

      <VDataTableServer
        v-model:page="options.page"
        :items-per-page="options.itemsPerPage"
        :headers="headers"
        :items="payments"
        :items-length="total"
        :loading="isLoading"
        no-data-text="Aucun paiement"
        loading-text="Chargement..."
        class="text-no-wrap"
      >
        <template #item.provider_reference="{ item }">
          <span class="font-weight-medium">{{ item.provider_reference ?? `#${item.id}` }}</span>
        </template>

        <template #item.user="{ item }">
          <div class="d-flex flex-column py-2">
            <span>{{ item.user?.name ?? '—' }}</span>
            <span class="text-body-2 text-medium-emphasis">{{ item.user?.email }}</span>
          </div>
        </template>

        <template #item.property="{ item }">
          {{ item.property?.title ?? '—' }}
        </template>

        <template #item.amount="{ item }">
          <span class="font-weight-medium">{{ formatMoney(item.amount, item.currency) }}</span>
        </template>

        <template #item.provider="{ item }">
          <span class="text-capitalize">{{ item.provider ?? '—' }}</span>
        </template>

        <template #item.created_at="{ item }">
          {{ formatDateTime(item.paid_at ?? item.created_at) }}
        </template>

        <template #item.status="{ item }">
          <VChip
            size="small"
            label
            :color="statusOf('payment', item.status).color"
          >
            {{ statusOf('payment', item.status).label }}
          </VChip>
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
