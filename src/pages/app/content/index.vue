<script setup>
const notify = useNotify()
const filters = reactive({ kind: null, status: null, search: '' })
const kinds = [{ title: 'Articles', value: 'article' }, { title: 'Guides', value: 'guide' }, { title: 'Textes légaux', value: 'legal' }]
const states = [{ title: 'Brouillons', value: 'draft' }, { title: 'Publiés', value: 'published' }]
const labels = { article: 'Article', guide: 'Guide', legal: 'Texte légal' }
const entries = ref([])
const total = ref(0)
const page = ref(1)
const perPage = 20
const loading = ref(false)
const loadError = ref(false)
let request = 0

const load = async () => {
  const current = ++request

  loading.value = true
  loadError.value = false
  try {
    const query = { page: page.value, per_page: perPage }
    for (const [key, value] of Object.entries(filters)) if (value?.trim()) query[key] = value.trim()
    const response = await $api('/admin/content', { query })
    if (current !== request) return
    entries.value = response.data ?? []
    total.value = response.meta?.total ?? 0
    if (page.value > 1 && !entries.value.length) page.value -= 1
  } catch (error) {
    if (current !== request) return
    entries.value = []
    total.value = 0
    loadError.value = true
    notify.fromError(error, 'Les contenus n’ont pas pu être chargés.')
  } finally {
    if (current === request) loading.value = false
  }
}

const resetPage = () => {
  if (page.value === 1) load()
  else page.value = 1
}

watch([() => filters.kind, () => filters.status], resetPage)
watchDebounced(() => filters.search, resetPage, { debounce: 400 })
watch(page, load, { immediate: true })
onBeforeUnmount(() => { request++ })

const headers = [
  { title: 'Titre', key: 'title', sortable: false },
  { title: 'Type', key: 'kind', sortable: false },
  { title: 'Catégorie', key: 'category', sortable: false },
  { title: 'Publication', key: 'status', sortable: false },
  { title: 'Date', key: 'date', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const editorOpen = ref(false)
const selected = ref(null)
const openCreate = () => { selected.value = null; editorOpen.value = true }
const openEdit = entry => { selected.value = entry; editorOpen.value = true }
const saved = () => { editorOpen.value = false; load() }
const pendingDelete = ref(null)
const deleting = ref(false)

const remove = async () => {
  if (!pendingDelete.value || deleting.value) return
  deleting.value = true
  try {
    await $api(`/admin/content/${pendingDelete.value.id}`, { method: 'DELETE' })
    pendingDelete.value = null
    notify.success('Contenu supprimé.')
    await load()
  } catch (error) {
    notify.fromError(error, 'Le contenu n’a pas pu être supprimé.')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-6">
      <div><h4 class="text-h4 mb-1">Contenus du site</h4><p class="text-body-1 text-medium-emphasis mb-0">Articles, guides et textes légaux publiés sur le site utilisateur</p></div>
      <VBtn prepend-icon="tabler-plus" @click="openCreate">Nouveau contenu</VBtn>
    </div>
    <VCard>
      <ListFilters v-model:search="filters.search" search-placeholder="Rechercher un titre ou un résumé…" :active="!!(filters.kind || filters.status)" @reset="filters.kind = null; filters.status = null">
        <VCol cols="12" md="3"><AppSelect v-model="filters.kind" :items="kinds" label="Type" placeholder="Tous les types" clearable /></VCol>
        <VCol cols="12" md="3"><AppSelect v-model="filters.status" :items="states" label="Publication" placeholder="Tous les statuts" clearable /></VCol>
      </ListFilters>
      <VAlert v-if="loadError" type="error" variant="tonal" class="ma-4" role="alert">Impossible de charger les contenus. <VBtn variant="text" :loading="loading" @click="load">Réessayer</VBtn></VAlert>
      <VDataTableServer v-model:page="page" :items-per-page="perPage" :items-per-page-options="[{ value: perPage, title: '20' }]" :headers="headers" :items="entries" :items-length="total" :loading="loading" no-data-text="Aucun contenu pour ces critères" loading-text="Chargement…">
        <template #item.title="{ item }"><div class="py-2"><strong>{{ item.title }}</strong><div class="text-body-2 text-medium-emphasis">{{ item.slug }}</div></div></template>
        <template #item.kind="{ item }">{{ labels[item.kind] ?? item.kind }}</template>
        <template #item.category="{ item }">{{ item.category || '—' }}</template>
        <template #item.status="{ item }"><VChip :color="item.status === 'published' ? 'success' : 'secondary'" size="small">{{ item.status === 'published' ? 'Publié' : 'Brouillon' }}</VChip><div v-if="item.is_provisional" class="text-warning text-body-2 mt-1">Provisoire</div></template>
        <template #item.date="{ item }">{{ item.date?.slice(0, 10) }}</template>
        <template #item.actions="{ item }"><div class="d-flex gap-1"><VBtn icon="tabler-edit" variant="text" :aria-label="`Modifier ${item.title}`" @click="openEdit(item)" /><VBtn icon="tabler-trash" variant="text" color="error" :aria-label="`Supprimer ${item.title}`" @click="pendingDelete = item" /></div></template>
      </VDataTableServer>
    </VCard>
    <VDialog v-model="editorOpen" max-width="960" persistent scrollable>
      <ContentEditor v-if="editorOpen" :entry="selected" @saved="saved" @cancel="editorOpen = false" />
    </VDialog>
    <VDialog :model-value="!!pendingDelete" max-width="480" :persistent="deleting" @update:model-value="value => { if (!value) pendingDelete = null }">
      <VCard title="Supprimer ce contenu ?"><VCardText>« {{ pendingDelete?.title }} » sera supprimé et ne sera plus accessible sur le site. Cette action est irréversible.</VCardText><VCardActions class="pa-4"><VBtn color="secondary" :disabled="deleting" @click="pendingDelete = null">Annuler</VBtn><VBtn color="error" variant="elevated" :loading="deleting" @click="remove">Supprimer</VBtn></VCardActions></VCard>
    </VDialog>
  </div>
</template>
