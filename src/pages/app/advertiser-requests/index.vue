<!--
  Demandes de compte annonceur : un client demande a publier des annonces.
  Accepter la demande fait passer son compte au role `proprietaire`.
-->
<script setup>
const route = useRoute()
const notify = useNotify()

const requests = ref([])
const isLoading = ref(true)

const statusFilter = ref(route.query.status ?? 'en_attente')
const search = ref('')
const from = ref(null)
const to = ref(null)

const load = async () => {
  isLoading.value = true

  try {
    const res = await $api('/admin/advertiser-requests')

    requests.value = res.data ?? []
  } catch (err) {
    notify.fromError(err, 'Les demandes n\'ont pas pu être chargées.')
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

const countBy = status => requests.value.filter(r => r.status === status).length

const tabs = computed(() => [
  { value: 'en_attente', title: 'En attente', count: countBy('en_attente') },
  { value: 'acceptee', title: 'Acceptées', count: countBy('acceptee') },
  { value: 'refusee', title: 'Refusées', count: countBy('refusee') },
  { value: 'all', title: 'Toutes', count: requests.value.length },
])

const filtered = computed(() => {
  const term = search.value?.trim().toLowerCase()

  return requests.value.filter(r => {
    if (statusFilter.value !== 'all' && r.status !== statusFilter.value) return false

    const day = r.requested_at?.slice(0, 10)
    if (from.value && day < from.value) return false
    if (to.value && day > to.value) return false
    if (!term) return true

    return [r.user?.name, r.user?.email, r.user?.phone, r.message]
      .some(value => value?.toLowerCase().includes(term))
  })
})

const headers = [
  { title: 'Demandeur', key: 'user', sortable: false },
  { title: 'Téléphone', key: 'phone', sortable: false },
  { title: 'Demandée le', key: 'requested_at' },
  { title: 'Statut', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
]

// 👉 Tiroir de detail
const selected = ref(null)

const isDrawerOpen = computed({
  get: () => !!selected.value,
  set: value => { if (!value) selected.value = null },
})

// 👉 Decision
const decision = ref(null)
const isDeciding = ref(false)

const askDecision = (request, status) => {
  decision.value = { request, status }
}

const decisionTexts = computed(() => {
  if (!decision.value) return {}

  const name = decision.value.request.user?.name ?? 'ce client'

  return decision.value.status === 'acceptee'
    ? {
      title: 'Accepter la demande ?',
      message: `${name} pourra publier des annonces : son compte passe au statut d'annonceur.`,
      label: 'Accepter',
      color: 'success',
    }
    : {
      title: 'Refuser la demande ?',
      message: `${name} restera client et ne pourra pas publier d'annonces.`,
      label: 'Refuser',
      color: 'error',
    }
})

const confirmDecision = async () => {
  const { request, status } = decision.value

  isDeciding.value = true

  try {
    const res = await $api(`/admin/advertiser-requests/${request.id}`, {
      method: 'PATCH',
      body: { status },
    })

    requests.value = requests.value.map(r => (r.id === request.id ? res.data : r))
    if (selected.value?.id === request.id) selected.value = res.data

    notify.success(status === 'acceptee' ? 'Demande acceptée : le compte est désormais annonceur.' : 'Demande refusée.')
    decision.value = null
  } catch (err) {
    notify.fromError(err, 'La décision n\'a pas pu être enregistrée.')
  } finally {
    isDeciding.value = false
  }
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-6">
      <div>
        <h4 class="text-h4 mb-1">
          Demandes de compte annonceur
        </h4>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Validez les clients qui souhaitent publier des annonces sur DASpace
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
      <VTabs
        v-model="statusFilter"
        class="v-tabs-pill px-4 pt-4"
      >
        <VTab
          v-for="tab in tabs"
          :key="tab.value"
          :value="tab.value"
          color="secondary"
        >
          {{ tab.title }}
          <!-- Sur l'onglet actif, le fond est deja gris : la pastille passe en blanc translucide. -->
          <VChip
            size="x-small"
            class="ms-2"
            variant="tonal"
            :color="statusFilter === tab.value ? undefined : 'secondary'"
          >
            {{ tab.count }}
          </VChip>
        </VTab>
      </VTabs>

      <ListFilters
        v-model:search="search"
        v-model:from="from"
        v-model:to="to"
        search-placeholder="Nom, e-mail, téléphone, message..."
        with-period
      />

      <VDivider />

      <VDataTable
        :headers="headers"
        :items="filtered"
        :loading="isLoading"
        :items-per-page="20"
        :sort-by="[{ key: 'requested_at', order: 'desc' }]"
        no-data-text="Aucune demande"
        loading-text="Chargement..."
        class="text-no-wrap"
        hover
        @click:row="(_, { item }) => (selected = item)"
      >
        <template #item.user="{ item }">
          <div class="d-flex align-center gap-3 py-2">
            <VAvatar
              size="34"
              color="primary"
              variant="tonal"
            >
              <VImg
                v-if="item.user?.photo"
                :src="item.user.photo"
              />
              <span v-else>{{ item.user?.name?.[0]?.toUpperCase() }}</span>
            </VAvatar>
            <div class="d-flex flex-column">
              <span class="font-weight-medium text-high-emphasis">{{ item.user?.name }}</span>
              <span class="text-body-2 text-medium-emphasis">{{ item.user?.email }}</span>
            </div>
          </div>
        </template>

        <template #item.phone="{ item }">
          {{ item.user?.phone ?? '—' }}
        </template>

        <template #item.requested_at="{ item }">
          {{ formatDateTime(item.requested_at) }}
        </template>

        <template #item.status="{ item }">
          <VChip
            size="small"
            label
            :color="statusOf('advertiserRequest', item.status).color"
          >
            {{ statusOf('advertiserRequest', item.status).label }}
          </VChip>
        </template>

        <template #item.actions="{ item }">
          <div
            v-if="item.status === 'en_attente'"
            class="d-flex justify-end gap-2"
          >
            <VBtn
              size="small"
              color="success"
              variant="tonal"
              prepend-icon="tabler-check"
              @click.stop="askDecision(item, 'acceptee')"
            >
              Accepter
            </VBtn>
            <VBtn
              size="small"
              color="error"
              variant="tonal"
              prepend-icon="tabler-x"
              @click.stop="askDecision(item, 'refusee')"
            >
              Refuser
            </VBtn>
          </div>
          <IconBtn
            v-else
            @click.stop="selected = item"
          >
            <VIcon icon="tabler-eye" />
          </IconBtn>
        </template>
      </VDataTable>
    </VCard>

    <!-- 👉 Detail de la demande -->
    <VNavigationDrawer
      v-model="isDrawerOpen"
      temporary
      location="end"
      width="420"
      class="scrollable-content"
    >
      <template v-if="selected">
        <AppDrawerHeaderSection
          title="Demande de compte annonceur"
          @cancel="selected = null"
        />
        <VDivider />

        <VCardText>
          <div class="d-flex align-center gap-3 mb-6">
            <VAvatar
              size="56"
              color="primary"
              variant="tonal"
            >
              <VImg
                v-if="selected.user?.photo"
                :src="selected.user.photo"
              />
              <span
                v-else
                class="text-h5"
              >{{ selected.user?.name?.[0]?.toUpperCase() }}</span>
            </VAvatar>
            <div>
              <h5 class="text-h5">
                {{ selected.user?.name }}
              </h5>
              <VChip
                size="small"
                label
                :color="statusOf('advertiserRequest', selected.status).color"
              >
                {{ statusOf('advertiserRequest', selected.status).label }}
              </VChip>
            </div>
          </div>

          <VList
            density="compact"
            class="card-list mb-6"
          >
            <VListItem prepend-icon="tabler-mail">
              {{ selected.user?.email }}
            </VListItem>
            <VListItem prepend-icon="tabler-phone">
              {{ selected.user?.phone ?? 'Téléphone non renseigné' }}
            </VListItem>
            <VListItem prepend-icon="tabler-map-pin">
              {{ selected.user?.address ?? 'Adresse non renseignée' }}
            </VListItem>
            <VListItem prepend-icon="tabler-calendar">
              Demandée le {{ formatDateTime(selected.requested_at) }}
            </VListItem>
            <VListItem prepend-icon="tabler-user-check">
              Rôle actuel : {{ roleOf(selected.user?.role).label }}
            </VListItem>
          </VList>

          <h6 class="text-h6 mb-2">
            Message du demandeur
          </h6>
          <p class="text-body-1 mb-6 message">
            {{ selected.message || 'Aucun message.' }}
          </p>

          <template v-if="selected.user?.profile_description">
            <h6 class="text-h6 mb-2">
              Présentation du profil
            </h6>
            <p class="text-body-1 mb-6 message">
              {{ selected.user.profile_description }}
            </p>
          </template>

          <div
            v-if="selected.status === 'en_attente'"
            class="d-flex gap-3"
          >
            <VBtn
              color="success"
              class="flex-grow-1"
              prepend-icon="tabler-check"
              @click="askDecision(selected, 'acceptee')"
            >
              Accepter
            </VBtn>
            <VBtn
              color="error"
              variant="tonal"
              class="flex-grow-1"
              prepend-icon="tabler-x"
              @click="askDecision(selected, 'refusee')"
            >
              Refuser
            </VBtn>
          </div>
        </VCardText>
      </template>
    </VNavigationDrawer>

    <ConfirmActionDialog
      :is-dialog-visible="!!decision"
      :title="decisionTexts.title ?? ''"
      :message="decisionTexts.message"
      :confirm-label="decisionTexts.label"
      :confirm-color="decisionTexts.color"
      :loading="isDeciding"
      @update:is-dialog-visible="value => { if (!value) decision = null }"
      @confirm="confirmDecision"
    />
  </div>
</template>

<style scoped>
.message {
  white-space: pre-line;
}
</style>
