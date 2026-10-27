<script setup>
const route = useRoute()
const notify = useNotify()

const users = ref([])
const isLoading = ref(true)

const filters = reactive({
  role: route.query.role ?? null,
  status: null,
  search: '',
  from: null,
  to: null,
})

const resetFilters = () => {
  filters.role = null
  filters.status = null
}

const load = async () => {
  isLoading.value = true

  try {
    const res = await $api('/admin/users')

    users.value = res.data ?? []
  } catch (err) {
    notify.fromError(err, 'Les utilisateurs n\'ont pas pu être chargés.')
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

const roleItems = Object.entries(ROLES).map(([value, { label }]) => ({ value, title: label }))
const statusItems = statusOptions('user')

const filtered = computed(() => {
  const term = filters.search?.trim().toLowerCase()

  return users.value.filter(u => {
    if (filters.role && u.role !== filters.role) return false
    if (filters.status && u.status !== filters.status) return false

    const day = u.created_at?.slice(0, 10)
    if (filters.from && day < filters.from) return false
    if (filters.to && day > filters.to) return false
    if (!term) return true

    return [u.name, u.email, u.phone].some(value => value?.toLowerCase().includes(term))
  })
})

const headers = [
  { title: 'Utilisateur', key: 'name' },
  { title: 'Téléphone', key: 'phone', sortable: false },
  { title: 'Rôle', key: 'role' },
  { title: 'Statut', key: 'status' },
  { title: 'Inscrit le', key: 'created_at' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
]

// Les comptes administrateurs sont proteges par l'API.
const isProtected = user => user.role === 'admin'

// 👉 Fiche utilisateur
const selected = ref(null)

const isDrawerOpen = computed({
  get: () => !!selected.value,
  set: value => { if (!value) selected.value = null },
})

// 👉 Actions
const pending = ref(null)
const isActing = ref(false)

const askBlock = user => {
  const blocking = user.status !== 'bloque'

  pending.value = {
    user,
    kind: 'status',
    status: blocking ? 'bloque' : 'actif',
    title: blocking ? 'Bloquer ce compte ?' : 'Débloquer ce compte ?',
    message: blocking
      ? `${user.name} ne pourra plus se connecter ni utiliser la plateforme.`
      : `${user.name} retrouvera l'accès à la plateforme.`,
    label: blocking ? 'Bloquer' : 'Débloquer',
    color: blocking ? 'error' : 'success',
  }
}

const askDelete = user => {
  pending.value = {
    user,
    kind: 'delete',
    title: 'Supprimer ce compte ?',
    message: `Le compte de ${user.name} sera définitivement supprimé. Cette action est irréversible.`,
    label: 'Supprimer',
    color: 'error',
  }
}

const confirmAction = async () => {
  const { user, kind, status } = pending.value

  isActing.value = true

  try {
    if (kind === 'delete') {
      await $api(`/admin/users/${user.id}`, { method: 'DELETE' })
      users.value = users.value.filter(u => u.id !== user.id)
      if (selected.value?.id === user.id) selected.value = null
      notify.success('Compte supprimé.')
    } else {
      const res = await $api(`/admin/users/${user.id}`, { method: 'PATCH', body: { status } })

      users.value = users.value.map(u => (u.id === user.id ? res.data : u))
      if (selected.value?.id === user.id) selected.value = res.data
      notify.success(status === 'bloque' ? 'Compte bloqué.' : 'Compte débloqué.')
    }

    pending.value = null
  } catch (err) {
    notify.fromError(err, 'L\'action n\'a pas pu être effectuée.')
  } finally {
    isActing.value = false
  }
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-6">
      <div>
        <h4 class="text-h4 mb-1">
          Utilisateurs
        </h4>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Clients, annonceurs et administrateurs de la plateforme
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
        search-placeholder="Nom, e-mail, téléphone..."
        with-period
        :active="!!(filters.role || filters.status)"
        @reset="resetFilters"
      >
        <VCol
          cols="6"
          md="2"
        >
          <AppSelect
            v-model="filters.role"
            :items="roleItems"
            placeholder="Rôle"
            clearable
          />
        </VCol>
        <VCol
          cols="6"
          md="2"
        >
          <AppSelect
            v-model="filters.status"
            :items="statusItems"
            placeholder="Statut"
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
        no-data-text="Aucun utilisateur"
        loading-text="Chargement..."
        class="text-no-wrap"
        hover
        @click:row="(_, { item }) => (selected = item)"
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center gap-3 py-2">
            <VAvatar
              size="34"
              :color="roleOf(item.role).color"
              variant="tonal"
            >
              <VImg
                v-if="item.photo"
                :src="item.photo"
              />
              <span v-else>{{ item.name?.[0]?.toUpperCase() }}</span>
            </VAvatar>
            <div class="d-flex flex-column">
              <span class="font-weight-medium text-high-emphasis">{{ item.name }}</span>
              <span class="text-body-2 text-medium-emphasis">{{ item.email }}</span>
            </div>
          </div>
        </template>

        <template #item.phone="{ item }">
          {{ item.phone ?? '—' }}
        </template>

        <template #item.role="{ item }">
          <VChip
            size="small"
            label
            variant="tonal"
            :color="roleOf(item.role).color"
          >
            {{ roleOf(item.role).label }}
          </VChip>
        </template>

        <template #item.status="{ item }">
          <VChip
            size="small"
            label
            :color="statusOf('user', item.status).color"
          >
            {{ statusOf('user', item.status).label }}
          </VChip>
        </template>

        <template #item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>

        <template #item.actions="{ item }">
          <div
            v-if="!isProtected(item)"
            class="d-flex justify-end"
          >
            <IconBtn @click.stop="askBlock(item)">
              <VIcon :icon="item.status === 'bloque' ? 'tabler-lock-open' : 'tabler-lock'" />
              <VTooltip activator="parent">
                {{ item.status === 'bloque' ? 'Débloquer' : 'Bloquer' }}
              </VTooltip>
            </IconBtn>
            <IconBtn @click.stop="askDelete(item)">
              <VIcon
                icon="tabler-trash"
                color="error"
              />
              <VTooltip activator="parent">
                Supprimer
              </VTooltip>
            </IconBtn>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- 👉 Fiche utilisateur -->
    <VNavigationDrawer
      v-model="isDrawerOpen"
      temporary
      location="end"
      width="400"
      class="scrollable-content"
    >
      <template v-if="selected">
        <AppDrawerHeaderSection
          title="Fiche utilisateur"
          @cancel="selected = null"
        />
        <VDivider />

        <VCardText>
          <div class="d-flex flex-column align-center text-center mb-6">
            <VAvatar
              size="80"
              :color="roleOf(selected.role).color"
              variant="tonal"
              class="mb-3"
            >
              <VImg
                v-if="selected.photo"
                :src="selected.photo"
              />
              <span
                v-else
                class="text-h4"
              >{{ selected.name?.[0]?.toUpperCase() }}</span>
            </VAvatar>
            <h5 class="text-h5 mb-2">
              {{ selected.name }}
            </h5>
            <div class="d-flex gap-2">
              <VChip
                size="small"
                label
                variant="tonal"
                :color="roleOf(selected.role).color"
              >
                {{ roleOf(selected.role).label }}
              </VChip>
              <VChip
                size="small"
                label
                :color="statusOf('user', selected.status).color"
              >
                {{ statusOf('user', selected.status).label }}
              </VChip>
            </div>
          </div>

          <VList
            density="compact"
            class="card-list mb-6"
          >
            <VListItem prepend-icon="tabler-mail">
              {{ selected.email }}
            </VListItem>
            <VListItem prepend-icon="tabler-phone">
              {{ selected.phone ?? 'Téléphone non renseigné' }}
            </VListItem>
            <VListItem prepend-icon="tabler-map-pin">
              {{ selected.address ?? 'Adresse non renseignée' }}
            </VListItem>
            <VListItem prepend-icon="tabler-calendar">
              Inscrit le {{ formatDate(selected.created_at) }}
            </VListItem>
          </VList>

          <template v-if="selected.profile_description">
            <h6 class="text-h6 mb-2">
              Présentation
            </h6>
            <p class="text-body-1 mb-6 description">
              {{ selected.profile_description }}
            </p>
          </template>

          <VBtn
            v-if="selected.role === 'proprietaire'"
            block
            variant="tonal"
            prepend-icon="tabler-home"
            class="mb-3"
            :to="{ name: 'properties', query: { owner_id: selected.id, owner_name: selected.name } }"
          >
            Voir les annonces
          </VBtn>

          <div
            v-if="!isProtected(selected)"
            class="d-flex gap-3"
          >
            <VBtn
              class="flex-grow-1"
              variant="tonal"
              :color="selected.status === 'bloque' ? 'success' : 'warning'"
              :prepend-icon="selected.status === 'bloque' ? 'tabler-lock-open' : 'tabler-lock'"
              @click="askBlock(selected)"
            >
              {{ selected.status === 'bloque' ? 'Débloquer' : 'Bloquer' }}
            </VBtn>
            <VBtn
              class="flex-grow-1"
              variant="tonal"
              color="error"
              prepend-icon="tabler-trash"
              @click="askDelete(selected)"
            >
              Supprimer
            </VBtn>
          </div>
          <VAlert
            v-else
            type="info"
            variant="tonal"
            density="compact"
          >
            Les comptes administrateurs ne peuvent pas être modifiés ici.
          </VAlert>
        </VCardText>
      </template>
    </VNavigationDrawer>

    <ConfirmActionDialog
      :is-dialog-visible="!!pending"
      :title="pending?.title ?? ''"
      :message="pending?.message"
      :confirm-label="pending?.label"
      :confirm-color="pending?.color"
      :loading="isActing"
      @update:is-dialog-visible="value => { if (!value) pending = null }"
      @confirm="confirmAction"
    />
  </div>
</template>

<style scoped>
.description {
  white-space: pre-line;
}
</style>
