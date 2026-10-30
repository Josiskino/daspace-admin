<script setup>
const stats = ref(null)
const isLoading = ref(true)
const loadError = ref('')

const load = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const res = await $api('/admin/statistics')

    stats.value = res.data
  } catch (err) {
    loadError.value = err?.response?._data?.message ?? 'Les statistiques n\'ont pas pu être chargées.'
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

// Ce qui attend une decision de l'administrateur, mis en tete de page.
const pendingItems = computed(() => [
  {
    title: 'Demandes de compte annonceur',
    value: stats.value?.pending_advertiser_requests ?? 0,
    icon: 'tabler-building-estate',
    to: { name: 'advertiser-requests', query: { status: 'en_attente' } },
  },
  {
    title: 'Annonces à valider',
    value: stats.value?.pending_properties ?? 0,
    icon: 'tabler-home-check',
    to: { name: 'properties', query: { status: 'en_attente' } },
  },
  {
    title: 'Signalements à traiter',
    value: stats.value?.pending_reports ?? 0,
    icon: 'tabler-flag',
    to: { name: 'reports', query: { status: 'en_attente' } },
  },
])

const platformItems = computed(() => [
  { title: 'Utilisateurs', value: formatNumber(stats.value?.total_users), icon: 'tabler-users', color: 'primary' },
  { title: 'Annonceurs', value: formatNumber(stats.value?.total_owners), icon: 'tabler-building-estate', color: 'info' },
  { title: 'Clients', value: formatNumber(stats.value?.total_clients), icon: 'tabler-user', color: 'secondary' },
  { title: 'Annonces publiées', value: formatNumber(stats.value?.validated_properties), icon: 'tabler-home', color: 'success' },
  { title: 'Vues des annonces', value: formatNumber(stats.value?.total_views), icon: 'tabler-eye', color: 'info' },
  { title: 'Visites 3D débloquées', value: formatNumber(stats.value?.total_3d_accesses), icon: 'tabler-cube-3d-sphere', color: 'warning' },
  { title: 'Paiements réussis', value: formatNumber(stats.value?.total_successful_payments), icon: 'tabler-receipt', color: 'success' },
  { title: 'Revenus', value: formatMoney(stats.value?.total_revenue), icon: 'tabler-cash', color: 'primary' },
])

// Icones des categories : l'API stocke les noms du site public (Lucide), traduits
// ici vers le jeu d'icones de l'admin.
const CATEGORY_ICONS = {
  'building-2': 'tabler-building',
  'home': 'tabler-home',
  'castle': 'tabler-building-castle',
  'door-open': 'tabler-door',
  'briefcase': 'tabler-briefcase',
  'map': 'tabler-map',
  'bed-single': 'tabler-bed',
  'store': 'tabler-building-store',
}

const categoryStats = computed(() => {
  const categories = stats.value?.categories ?? []
  const total = categories.reduce((sum, c) => sum + c.properties_count, 0)

  return [...categories]
    .sort((a, b) => b.properties_count - a.properties_count || a.name.localeCompare(b.name))
    .map(c => ({
      ...c,
      icon: CATEGORY_ICONS[c.icon] ?? 'tabler-category',
      share: total ? Math.round((c.properties_count / total) * 100) : 0,
    }))
})
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-6">
      <div>
        <h4 class="text-h4 mb-1">
          Tableau de bord
        </h4>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Vue d'ensemble de la plateforme DASpace
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

    <VAlert
      v-if="loadError"
      type="error"
      variant="tonal"
      class="mb-6"
    >
      {{ loadError }}
    </VAlert>

    <!-- 👉 En attente de decision -->
    <h6 class="text-h6 mb-3">
      À traiter
    </h6>
    <VRow class="mb-4">
      <VCol
        v-for="item in pendingItems"
        :key="item.title"
        cols="12"
        md="4"
      >
        <VCard
          :to="item.to"
          :loading="isLoading"
        >
          <VCardText class="d-flex align-center gap-4">
            <VAvatar
              :color="item.value > 0 ? 'warning' : 'success'"
              variant="tonal"
              rounded
              size="48"
            >
              <VIcon
                :icon="item.icon"
                size="28"
              />
            </VAvatar>
            <div class="flex-grow-1">
              <h4 class="text-h4">
                {{ item.value }}
              </h4>
              <span class="text-body-1">{{ item.title }}</span>
            </div>
            <VIcon
              icon="tabler-chevron-right"
              class="text-disabled"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- 👉 Indicateurs -->
    <h6 class="text-h6 mb-3">
      Activité de la plateforme
    </h6>
    <VRow class="mb-4">
      <VCol
        v-for="item in platformItems"
        :key="item.title"
        cols="12"
        sm="6"
        lg="3"
      >
        <VCard :loading="isLoading">
          <VCardText class="d-flex align-center gap-4">
            <VAvatar
              :color="item.color"
              variant="tonal"
              rounded
              size="42"
            >
              <VIcon
                :icon="item.icon"
                size="24"
              />
            </VAvatar>
            <div>
              <h5 class="text-h5">
                {{ item.value }}
              </h5>
              <span class="text-body-2 text-medium-emphasis">{{ item.title }}</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- 👉 Annonces par categorie -->
    <VCard>
      <VCardItem>
        <VCardTitle>Annonces par catégorie</VCardTitle>
        <VCardSubtitle>Répartition de toutes les annonces, quel que soit leur statut</VCardSubtitle>
        <template #append>
          <VBtn
            variant="text"
            size="small"
            append-icon="tabler-chevron-right"
            :to="{ name: 'categories' }"
          >
            Gérer
          </VBtn>
        </template>
      </VCardItem>

      <VCardText v-if="!categoryStats.length">
        <span class="text-medium-emphasis">Aucune catégorie pour le moment.</span>
      </VCardText>

      <VCardText v-else>
        <div class="category-grid">
          <div
            v-for="category in categoryStats"
            :key="category.id"
            class="category-tile"
            :class="{ 'is-empty': !category.properties_count }"
          >
            <div class="d-flex align-center gap-3 mb-3">
              <VAvatar
                size="36"
                rounded
                color="primary"
                variant="tonal"
              >
                <VIcon
                  :icon="category.icon"
                  size="20"
                />
              </VAvatar>
              <span class="text-body-1 font-weight-medium text-high-emphasis text-truncate">{{ category.name }}</span>
            </div>
            <div class="d-flex align-baseline justify-space-between mb-2">
              <span class="text-h4">{{ category.properties_count }}</span>
              <span class="text-body-2 text-medium-emphasis">{{ category.share }} %</span>
            </div>
            <VProgressLinear
              :model-value="category.share"
              color="primary"
              bg-color="secondary"
              rounded
              height="4"
            />
          </div>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<style lang="scss" scoped>
.category-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
}

.category-tile {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  padding: 1rem;

  &.is-empty {
    opacity: 0.55;
  }
}
</style>
