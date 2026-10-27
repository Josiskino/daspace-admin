<!--
  Categories de biens proposees aux annonceurs. L'API permet aujourd'hui d'en
  creer ; la modification et la suppression ne sont pas encore exposees.
-->
<script setup>
const notify = useNotify()

const categories = ref([])
const counts = ref({})
const isLoading = ref(true)
const search = ref('')

const filtered = computed(() => {
  const term = search.value?.trim().toLowerCase()

  return term ? categories.value.filter(c => c.name.toLowerCase().includes(term)) : categories.value
})

const load = async () => {
  isLoading.value = true

  try {
    // Le nombre d'annonces par categorie vient des statistiques.
    const [list, stats] = await Promise.all([
      $api('/categories'),
      $api('/admin/statistics').catch(() => null),
    ])

    categories.value = list.data ?? []
    counts.value = Object.fromEntries((stats?.data?.categories ?? []).map(c => [c.id, c.properties_count]))
  } catch (err) {
    notify.fromError(err, 'Les catégories n\'ont pas pu être chargées.')
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

const headers = [
  { title: 'Catégorie', key: 'name' },
  { title: 'Annonces', key: 'count', sortable: false },
  { title: 'Créée le', key: 'created_at' },
]

// 👉 Creation
const isDrawerOpen = ref(false)
const form = ref({ name: '', icon: '' })
const formErrors = ref({})
const refForm = ref()
const isSaving = ref(false)

const openCreate = () => {
  form.value = { name: '', icon: '' }
  formErrors.value = {}
  isDrawerOpen.value = true
}

const save = async () => {
  const { valid } = await refForm.value.validate()
  if (!valid) return

  isSaving.value = true
  formErrors.value = {}

  try {
    const res = await $api('/admin/categories', {
      method: 'POST',
      body: { name: form.value.name.trim(), icon: form.value.icon.trim() || undefined },
    })

    categories.value = [...categories.value, res.data].sort((a, b) => a.name.localeCompare(b.name))
    notify.success('Catégorie créée.')
    isDrawerOpen.value = false
  } catch (err) {
    const errors = err?.response?._data?.errors

    if (errors && !Array.isArray(errors)) formErrors.value = errors
    else notify.fromError(err, 'La catégorie n\'a pas pu être créée.')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-6">
      <div>
        <h4 class="text-h4 mb-1">
          Catégories
        </h4>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Types de biens proposés aux annonceurs
        </p>
      </div>
      <VBtn
        prepend-icon="tabler-plus"
        @click="openCreate"
      >
        Nouvelle catégorie
      </VBtn>
    </div>

    <VCard>
      <ListFilters
        v-model:search="search"
        search-placeholder="Rechercher une catégorie..."
      />

      <VDivider />

      <VDataTable
        :headers="headers"
        :items="filtered"
        :loading="isLoading"
        :items-per-page="-1"
        no-data-text="Aucune catégorie"
        loading-text="Chargement..."
        hide-default-footer
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center gap-3 py-2">
            <VAvatar
              size="34"
              variant="tonal"
              color="primary"
              rounded
            >
              <VIcon icon="tabler-category" />
            </VAvatar>
            <div class="d-flex flex-column">
              <span class="font-weight-medium text-high-emphasis">{{ item.name }}</span>
              <span
                v-if="item.icon"
                class="text-body-2 text-medium-emphasis"
              >Icône : {{ item.icon }}</span>
            </div>
          </div>
        </template>

        <template #item.count="{ item }">
          {{ counts[item.id] ?? 0 }}
        </template>

        <template #item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>
      </VDataTable>
    </VCard>

    <VNavigationDrawer
      v-model="isDrawerOpen"
      temporary
      location="end"
      width="380"
    >
      <AppDrawerHeaderSection
        title="Nouvelle catégorie"
        @cancel="isDrawerOpen = false"
      />
      <VDivider />

      <VCardText>
        <VForm
          ref="refForm"
          @submit.prevent="save"
        >
          <AppTextField
            v-model="form.name"
            label="Nom"
            placeholder="Appartement, Villa, Terrain..."
            class="mb-4"
            autofocus
            :rules="[requiredValidator]"
            :error-messages="formErrors.name"
          />
          <AppTextField
            v-model="form.icon"
            label="Icône (facultatif)"
            placeholder="home"
            hint="Nom d'icône utilisé par le site public"
            persistent-hint
            class="mb-6"
            :error-messages="formErrors.icon"
          />

          <div class="d-flex gap-3">
            <VBtn
              type="submit"
              :loading="isSaving"
            >
              Créer
            </VBtn>
            <VBtn
              variant="tonal"
              color="secondary"
              :disabled="isSaving"
              @click="isDrawerOpen = false"
            >
              Annuler
            </VBtn>
          </div>
        </VForm>
      </VCardText>
    </VNavigationDrawer>
  </div>
</template>
