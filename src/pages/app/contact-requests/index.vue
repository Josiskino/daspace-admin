<!-- Messages envoyes depuis le formulaire de contact du site public. -->
<script setup>
const notify = useNotify()

const filters = reactive({ status: null, search: '', from: null, to: null })

const resetFilters = () => { filters.status = null }

const { items: messages, total, isLoading, options, load } = usePagedList('/admin/contact-requests', filters, 'Les messages n\'ont pas pu être chargés.')

const headers = [
  { title: 'Expéditeur', key: 'name', sortable: false },
  { title: 'Sujet', key: 'subject', sortable: false },
  { title: 'Reçu le', key: 'created_at', sortable: false },
  { title: 'Statut', key: 'status', sortable: false },
]

const statusItems = statusOptions('contactRequest')

const selected = ref(null)

const isDrawerOpen = computed({
  get: () => !!selected.value,
  set: value => { if (!value) selected.value = null },
})

const isUpdating = ref(false)

const setStatus = async status => {
  const message = selected.value

  isUpdating.value = true

  try {
    const res = await $api(`/admin/contact-requests/${message.id}`, { method: 'PATCH', body: { status } })

    messages.value = messages.value.map(m => (m.id === message.id ? res.data : m))
    selected.value = res.data
    notify.success('Statut mis à jour.')
  } catch (err) {
    notify.fromError(err, 'Le statut n\'a pas pu être modifié.')
  } finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-6">
      <div>
        <h4 class="text-h4 mb-1">
          Messages de contact
        </h4>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Demandes reçues via le formulaire de contact du site
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
        search-placeholder="Nom, e-mail, sujet..."
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
        :items="messages"
        :items-length="total"
        :loading="isLoading"
        no-data-text="Aucun message"
        loading-text="Chargement..."
        hover
        @click:row="(_, { item }) => (selected = item)"
      >
        <template #item.name="{ item }">
          <div class="d-flex flex-column py-2">
            <span class="font-weight-medium text-high-emphasis">{{ item.name }}</span>
            <span class="text-body-2 text-medium-emphasis">{{ item.email }}</span>
          </div>
        </template>

        <template #item.subject="{ item }">
          {{ item.subject || '—' }}
        </template>

        <template #item.created_at="{ item }">
          {{ formatDateTime(item.created_at) }}
        </template>

        <template #item.status="{ item }">
          <VChip
            size="small"
            label
            :color="statusOf('contactRequest', item.status).color"
          >
            {{ statusOf('contactRequest', item.status).label }}
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

    <VNavigationDrawer
      v-model="isDrawerOpen"
      temporary
      location="end"
      width="440"
      class="scrollable-content"
    >
      <template v-if="selected">
        <AppDrawerHeaderSection
          title="Message de contact"
          @cancel="selected = null"
        />
        <VDivider />

        <VCardText>
          <h5 class="text-h5 mb-4">
            {{ selected.subject || 'Sans sujet' }}
          </h5>

          <VList
            density="compact"
            class="card-list mb-6"
          >
            <VListItem prepend-icon="tabler-user">
              {{ selected.name }}
            </VListItem>
            <VListItem
              prepend-icon="tabler-mail"
              :href="`mailto:${selected.email}`"
            >
              {{ selected.email }}
            </VListItem>
            <VListItem
              v-if="selected.phone"
              prepend-icon="tabler-phone"
              :href="`tel:${selected.phone}`"
            >
              {{ selected.phone }}
            </VListItem>
            <VListItem prepend-icon="tabler-calendar">
              {{ formatDateTime(selected.created_at) }}
            </VListItem>
          </VList>

          <p class="text-body-1 mb-6 message">
            {{ selected.message }}
          </p>

          <AppSelect
            :model-value="selected.status"
            :items="statusItems"
            label="Statut du traitement"
            :loading="isUpdating"
            :disabled="isUpdating"
            @update:model-value="setStatus"
          />
        </VCardText>
      </template>
    </VNavigationDrawer>
  </div>
</template>

<style scoped>
.message {
  white-space: pre-line;
}
</style>
