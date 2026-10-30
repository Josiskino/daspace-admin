<!--
  Moderation des annonces : une annonce creee par un annonceur reste
  `en_attente` et n'apparait sur le site qu'une fois `validee`.
-->
<script setup>
const route = useRoute()
const notify = useNotify()

const properties = ref([])
const total = ref(0)
const isLoading = ref(false)
const categories = ref([])

const filters = reactive({
  status: route.query.status ?? null,
  category_id: null,
  owner_id: route.query.owner_id ?? null,
  search: '',
})

// Arrivee depuis la fiche d'un annonceur : seules ses annonces sont listees.
const ownerName = ref(route.query.owner_name ?? '')

const clearOwner = () => {
  filters.owner_id = null
  ownerName.value = ''
}

const options = ref({ page: 1, itemsPerPage: 20 })

const headers = [
  { title: 'Annonce', key: 'title', sortable: false },
  { title: 'Annonceur', key: 'owner', sortable: false },
  { title: 'Prix', key: 'price', sortable: false },
  { title: 'Créée le', key: 'created_at', sortable: false },
  { title: 'Statut', key: 'status', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
]

const load = async () => {
  isLoading.value = true

  try {
    const res = await $api('/admin/properties', {
      query: {
        page: options.value.page,
        per_page: options.value.itemsPerPage,
        status: filters.status || undefined,
        category_id: filters.category_id || undefined,
        owner_id: filters.owner_id || undefined,
        search: filters.search?.trim() || undefined,
      },
    })

    properties.value = res.data ?? []
    total.value = res.meta?.total ?? 0
  } catch (err) {
    notify.fromError(err, 'Les annonces n\'ont pas pu être chargées.')
  } finally {
    isLoading.value = false
  }
}

const loadCategories = async () => {
  try {
    const res = await $api('/categories')

    categories.value = (res.data ?? []).map(c => ({ value: c.id, title: c.name }))
  } catch {
    // Le filtre par categorie reste simplement vide.
  }
}

onMounted(loadCategories)

// Un changement de filtre ramene a la premiere page ; la recherche attend la
// fin de la frappe pour ne pas lancer un appel par lettre.
watch(() => [filters.status, filters.category_id, filters.owner_id], () => {
  options.value = { ...options.value, page: 1 }
})
watchDebounced(() => filters.search, () => {
  options.value = { ...options.value, page: 1 }
}, { debounce: 400 })
watch(options, load, { deep: true, immediate: true })

const statusItems = statusOptions('property')

const priceLabel = property => {
  const suffix = property.operation === 'vente'
    ? ''
    : property.period === 'journalier' ? ' / jour' : ' / mois'

  return `${formatMoney(property.price)}${suffix}`
}

const coverOf = property => property.media?.find(m => m.type === 'photo')?.url

// 👉 Tiroir de detail
const selected = ref(null)

const isDrawerOpen = computed({
  get: () => !!selected.value,
  set: value => { if (!value) selected.value = null },
})

const photos = computed(() => (selected.value?.media ?? []).filter(m => m.type === 'photo'))

// Photo affichee en grand dans le tiroir ; revient a la premiere a chaque annonce.
const activePhoto = ref(0)

watch(selected, () => { activePhoto.value = 0 })

const features = computed(() => {
  const p = selected.value
  if (!p) return []

  return [
    { icon: 'tabler-bed', label: 'Chambres', value: p.bedrooms },
    { icon: 'tabler-sofa', label: 'Salons', value: p.living_rooms },
    { icon: 'tabler-bath', label: 'Douches', value: p.bathrooms },
    { icon: 'tabler-ruler-2', label: 'Surface', value: p.area ? `${formatNumber(p.area)} m²` : null },
    { icon: 'tabler-car-garage', label: 'Garage', value: p.garage ? 'Oui' : 'Non' },
    { icon: 'tabler-pool', label: 'Piscine', value: p.pool ? 'Oui' : 'Non' },
  ].filter(f => f.value !== null && f.value !== undefined)
})

// 👉 Moderation
const decision = ref(null)
const isDeciding = ref(false)

const DECISIONS = {
  validee: {
    title: 'Valider l\'annonce ?',
    message: 'L\'annonce sera publiée et visible par tous les visiteurs du site.',
    label: 'Valider',
    color: 'success',
    done: 'Annonce validée et publiée.',
  },
  refusee: {
    title: 'Refuser l\'annonce ?',
    message: 'L\'annonce ne sera pas publiée. L\'annonceur la verra comme refusée.',
    label: 'Refuser',
    color: 'error',
    done: 'Annonce refusée.',
  },
  en_attente: {
    title: 'Remettre en attente ?',
    message: 'L\'annonce sera retirée du site jusqu\'à une nouvelle décision.',
    label: 'Remettre en attente',
    color: 'warning',
    done: 'Annonce remise en attente.',
  },
}

const askDecision = (property, status) => {
  decision.value = { property, status, ...DECISIONS[status] }
}

const confirmDecision = async () => {
  const { property, status, done } = decision.value

  isDeciding.value = true

  try {
    const res = await $api(`/admin/properties/${property.id}/status`, {
      method: 'PATCH',
      body: { status },
    })

    properties.value = properties.value.map(p => (p.id === property.id ? res.data : p))
    if (selected.value?.id === property.id) selected.value = res.data

    notify.success(done)
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
          Annonces
        </h4>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Validez les annonces avant leur publication sur le site
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
      <VCardText>
        <VChip
          v-if="filters.owner_id"
          closable
          color="primary"
          class="mb-4"
          prepend-icon="tabler-user"
          @click:close="clearOwner"
        >
          Annonces de {{ ownerName || `l'annonceur #${filters.owner_id}` }}
        </VChip>
        <VRow>
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
          <VCol
            cols="12"
            md="4"
          >
            <AppSelect
              v-model="filters.category_id"
              :items="categories"
              placeholder="Toutes les catégories"
              clearable
            />
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <AppTextField
              v-model="filters.search"
              placeholder="Titre, adresse, ville..."
              prepend-inner-icon="tabler-search"
              clearable
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VDataTableServer
        v-model:items-per-page="options.itemsPerPage"
        v-model:page="options.page"
        :headers="headers"
        :items="properties"
        :items-length="total"
        :loading="isLoading"
        no-data-text="Aucune annonce"
        loading-text="Chargement..."
        class="text-no-wrap"
        hover
        @click:row="(_, { item }) => (selected = item)"
      >
        <template #item.title="{ item }">
          <div class="d-flex align-center gap-3 py-2">
            <VAvatar
              rounded
              size="42"
              color="primary"
              variant="tonal"
            >
              <VImg
                v-if="coverOf(item)"
                :src="toMediaUrl(coverOf(item))"
                cover
              />
              <VIcon
                v-else
                icon="tabler-home"
              />
            </VAvatar>
            <div class="d-flex flex-column">
              <span class="font-weight-medium text-high-emphasis">{{ item.title }}</span>
              <span class="text-body-2 text-medium-emphasis">
                {{ item.category?.name ?? '—' }} · {{ item.city }}
              </span>
            </div>
          </div>
        </template>

        <template #item.owner="{ item }">
          <div class="d-flex flex-column">
            <span>{{ item.owner?.name ?? '—' }}</span>
            <span class="text-body-2 text-medium-emphasis">{{ item.owner?.email }}</span>
          </div>
        </template>

        <template #item.price="{ item }">
          {{ priceLabel(item) }}
        </template>

        <template #item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>

        <template #item.status="{ item }">
          <VChip
            size="small"
            label
            :color="statusOf('property', item.status).color"
          >
            {{ statusOf('property', item.status).label }}
          </VChip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex justify-end gap-1">
            <template v-if="item.status === 'en_attente'">
              <VBtn
                size="small"
                color="success"
                variant="tonal"
                @click.stop="askDecision(item, 'validee')"
              >
                Valider
              </VBtn>
              <VBtn
                size="small"
                color="error"
                variant="tonal"
                @click.stop="askDecision(item, 'refusee')"
              >
                Refuser
              </VBtn>
            </template>
            <IconBtn
              v-else
              @click.stop="selected = item"
            >
              <VIcon icon="tabler-eye" />
            </IconBtn>
          </div>
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

    <!-- 👉 Detail de l'annonce -->
    <VNavigationDrawer
      v-model="isDrawerOpen"
      temporary
      location="end"
      width="480"
      class="scrollable-content"
    >
      <template v-if="selected">
        <AppDrawerHeaderSection
          title="Détail de l'annonce"
          @cancel="selected = null"
        />
        <VDivider />

        <div
          v-if="photos.length"
          class="px-6 pt-6"
        >
          <VImg
            :src="toMediaUrl(photos[activePhoto]?.url)"
            :aspect-ratio="4 / 3"
            cover
            rounded="lg"
            class="bg-surface-variant"
          />
          <div
            v-if="photos.length > 1"
            class="photo-thumbs mt-2"
          >
            <button
              v-for="(photo, index) in photos"
              :key="photo.id"
              type="button"
              class="photo-thumb"
              :class="{ 'is-active': index === activePhoto }"
              :aria-label="`Photo ${index + 1}`"
              @click="activePhoto = index"
            >
              <VImg
                :src="toMediaUrl(photo.url)"
                :aspect-ratio="1"
                cover
              />
            </button>
          </div>
        </div>

        <VCardText>
          <div class="d-flex align-center justify-space-between gap-2 mb-1">
            <h5 class="text-h5">
              {{ selected.title }}
            </h5>
            <VChip
              size="small"
              label
              :color="statusOf('property', selected.status).color"
            >
              {{ statusOf('property', selected.status).label }}
            </VChip>
          </div>
          <p class="text-body-1 text-medium-emphasis mb-1">
            {{ selected.category?.name ?? '—' }} · {{ selected.operation === 'vente' ? 'Vente' : 'Location' }}
          </p>
          <h6 class="text-h6 text-primary mb-4">
            {{ priceLabel(selected) }}
          </h6>

          <VList
            density="compact"
            class="card-list mb-4"
          >
            <VListItem prepend-icon="tabler-map-pin">
              {{ selected.address }}, {{ selected.city }}
            </VListItem>
            <VListItem prepend-icon="tabler-calendar-check">
              {{ selected.availability }}
            </VListItem>
            <VListItem prepend-icon="tabler-eye">
              {{ formatNumber(selected.views) }} vue(s)
            </VListItem>
            <VListItem
              v-if="selected.three_d_price"
              prepend-icon="tabler-cube-3d-sphere"
            >
              Visite 3D : {{ formatMoney(selected.three_d_price) }}
            </VListItem>
          </VList>

          <div class="d-flex flex-wrap gap-2 mb-4">
            <VChip
              v-for="feature in features"
              :key="feature.label"
              size="small"
              variant="tonal"
              :prepend-icon="feature.icon"
            >
              {{ feature.label }} : {{ feature.value }}
            </VChip>
          </div>

          <h6 class="text-h6 mb-2">
            Description
          </h6>
          <p class="text-body-1 mb-4 description">
            {{ selected.description }}
          </p>

          <h6 class="text-h6 mb-2">
            Annonceur
          </h6>
          <VList
            density="compact"
            class="card-list mb-6"
          >
            <VListItem prepend-icon="tabler-user">
              {{ selected.owner?.name ?? '—' }}
            </VListItem>
            <VListItem prepend-icon="tabler-mail">
              {{ selected.owner?.email ?? '—' }}
            </VListItem>
            <VListItem prepend-icon="tabler-phone">
              {{ selected.owner?.phone ?? 'Téléphone non renseigné' }}
            </VListItem>
          </VList>

          <div class="d-flex flex-wrap gap-3">
            <VBtn
              v-if="selected.status !== 'validee'"
              color="success"
              class="flex-grow-1"
              prepend-icon="tabler-check"
              @click="askDecision(selected, 'validee')"
            >
              Valider
            </VBtn>
            <VBtn
              v-if="selected.status !== 'refusee'"
              color="error"
              variant="tonal"
              class="flex-grow-1"
              prepend-icon="tabler-x"
              @click="askDecision(selected, 'refusee')"
            >
              Refuser
            </VBtn>
            <VBtn
              v-if="selected.status !== 'en_attente'"
              color="warning"
              variant="tonal"
              class="flex-grow-1"
              prepend-icon="tabler-clock"
              @click="askDecision(selected, 'en_attente')"
            >
              Remettre en attente
            </VBtn>
          </div>
        </VCardText>
      </template>
    </VNavigationDrawer>

    <ConfirmActionDialog
      :is-dialog-visible="!!decision"
      :title="decision?.title ?? ''"
      :message="decision?.message"
      :confirm-label="decision?.label"
      :confirm-color="decision?.color"
      :loading="isDeciding"
      @update:is-dialog-visible="value => { if (!value) decision = null }"
      @confirm="confirmDecision"
    />
  </div>
</template>

<style lang="scss" scoped>
.description {
  white-space: pre-line;
}

.photo-thumbs {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(5, 1fr);
}

.photo-thumb {
  overflow: hidden;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0.7;

  &.is-active {
    border-color: rgb(var(--v-theme-primary));
    opacity: 1;
  }
}
</style>
