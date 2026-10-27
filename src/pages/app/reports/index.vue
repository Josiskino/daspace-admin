<!-- Signalements d'annonces envoyes par les clients. -->
<script setup>
const route = useRoute()
const notify = useNotify()

const reports = ref([])
const isLoading = ref(true)
const statusFilter = ref(route.query.status ?? null)
const search = ref('')
const from = ref(null)
const to = ref(null)

const load = async () => {
  isLoading.value = true

  try {
    const res = await $api('/admin/reports')

    reports.value = res.data ?? []
  } catch (err) {
    notify.fromError(err, 'Les signalements n\'ont pas pu être chargés.')
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

const statusItems = statusOptions('report')

const filtered = computed(() => {
  const term = search.value?.trim().toLowerCase()

  return reports.value.filter(r => {
    if (statusFilter.value && r.status !== statusFilter.value) return false

    const day = r.created_at?.slice(0, 10)
    if (from.value && day < from.value) return false
    if (to.value && day > to.value) return false
    if (!term) return true

    return [r.reason, r.details, r.property?.title, r.property?.owner?.name, r.client?.name, r.client?.email]
      .some(value => value?.toLowerCase().includes(term))
  })
})

const headers = [
  { title: 'Annonce', key: 'property', sortable: false },
  { title: 'Motif', key: 'reason', sortable: false },
  { title: 'Signalé par', key: 'client', sortable: false },
  { title: 'Date', key: 'created_at' },
  { title: 'Statut', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
]

const selected = ref(null)

const isDrawerOpen = computed({
  get: () => !!selected.value,
  set: value => { if (!value) selected.value = null },
})

const updating = ref(null)

const setStatus = async (report, status) => {
  updating.value = report.id

  try {
    const res = await $api(`/admin/reports/${report.id}`, { method: 'PATCH', body: { status } })

    reports.value = reports.value.map(r => (r.id === report.id ? res.data : r))
    if (selected.value?.id === report.id) selected.value = res.data
    notify.success(status === 'traite' ? 'Signalement marqué comme traité.' : 'Signalement remis en attente.')
  } catch (err) {
    notify.fromError(err, 'Le statut n\'a pas pu être modifié.')
  } finally {
    updating.value = null
  }
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-6">
      <div>
        <h4 class="text-h4 mb-1">
          Signalements
        </h4>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Annonces signalées par les visiteurs de la plateforme
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
        v-model:search="search"
        v-model:from="from"
        v-model:to="to"
        search-placeholder="Motif, annonce, client..."
        with-period
        :active="!!statusFilter"
        @reset="statusFilter = null"
      >
        <VCol
          cols="12"
          md="4"
        >
          <AppSelect
            v-model="statusFilter"
            :items="statusItems"
            placeholder="Tous les statuts"
            clearable
          />
        </VCol>
      </ListFilters>

      <VDivider />

      <VDataTable
        :headers="headers"
        :items="filtered"
        :loading="isLoading"
        :items-per-page="20"
        no-data-text="Aucun signalement"
        loading-text="Chargement..."
        hover
        @click:row="(_, { item }) => (selected = item)"
      >
        <template #item.property="{ item }">
          <div class="d-flex flex-column py-2">
            <span class="font-weight-medium text-high-emphasis">{{ item.property?.title ?? 'Annonce supprimée' }}</span>
            <span class="text-body-2 text-medium-emphasis">{{ item.property?.owner?.name }}</span>
          </div>
        </template>

        <template #item.reason="{ item }">
          {{ item.reason }}
        </template>

        <template #item.client="{ item }">
          {{ item.client?.name ?? '—' }}
        </template>

        <template #item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>

        <template #item.status="{ item }">
          <VChip
            size="small"
            label
            :color="statusOf('report', item.status).color"
          >
            {{ statusOf('report', item.status).label }}
          </VChip>
        </template>

        <template #item.actions="{ item }">
          <VBtn
            v-if="item.status === 'en_attente'"
            size="small"
            variant="tonal"
            color="success"
            :loading="updating === item.id"
            @click.stop="setStatus(item, 'traite')"
          >
            Marquer traité
          </VBtn>
        </template>
      </VDataTable>
    </VCard>

    <VNavigationDrawer
      v-model="isDrawerOpen"
      temporary
      location="end"
      width="420"
      class="scrollable-content"
    >
      <template v-if="selected">
        <AppDrawerHeaderSection
          title="Signalement"
          @cancel="selected = null"
        />
        <VDivider />

        <VCardText>
          <VChip
            size="small"
            label
            class="mb-4"
            :color="statusOf('report', selected.status).color"
          >
            {{ statusOf('report', selected.status).label }}
          </VChip>

          <h6 class="text-h6 mb-1">
            Motif
          </h6>
          <p class="text-body-1 mb-4">
            {{ selected.reason }}
          </p>

          <h6 class="text-h6 mb-1">
            Détails
          </h6>
          <p class="text-body-1 mb-6 details">
            {{ selected.details || 'Aucun détail.' }}
          </p>

          <h6 class="text-h6 mb-2">
            Annonce concernée
          </h6>
          <VList
            density="compact"
            class="card-list mb-4"
          >
            <VListItem prepend-icon="tabler-home">
              {{ selected.property?.title ?? 'Annonce supprimée' }}
            </VListItem>
            <VListItem
              v-if="selected.property"
              prepend-icon="tabler-user"
            >
              {{ selected.property.owner?.name }} · {{ selected.property.owner?.email }}
            </VListItem>
          </VList>

          <h6 class="text-h6 mb-2">
            Signalé par
          </h6>
          <VList
            density="compact"
            class="card-list mb-6"
          >
            <VListItem prepend-icon="tabler-user">
              {{ selected.client?.name ?? '—' }}
            </VListItem>
            <VListItem prepend-icon="tabler-mail">
              {{ selected.client?.email ?? '—' }}
            </VListItem>
            <VListItem prepend-icon="tabler-calendar">
              {{ formatDateTime(selected.created_at) }}
            </VListItem>
          </VList>

          <div class="d-flex flex-wrap gap-3">
            <VBtn
              v-if="selected.property"
              variant="tonal"
              prepend-icon="tabler-home-check"
              class="flex-grow-1"
              :to="{ name: 'properties', query: { owner_id: selected.property.owner?.id, owner_name: selected.property.owner?.name } }"
            >
              Modérer l'annonce
            </VBtn>
            <VBtn
              color="success"
              class="flex-grow-1"
              :variant="selected.status === 'traite' ? 'tonal' : 'elevated'"
              :loading="updating === selected.id"
              @click="setStatus(selected, selected.status === 'traite' ? 'en_attente' : 'traite')"
            >
              {{ selected.status === 'traite' ? 'Remettre en attente' : 'Marquer traité' }}
            </VBtn>
          </div>
        </VCardText>
      </template>
    </VNavigationDrawer>
  </div>
</template>

<style scoped>
.details {
  white-space: pre-line;
}
</style>
