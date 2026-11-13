<script setup>
const notify = useNotify()
const loading = ref(true)
const saving = ref(false)
const failed = ref(false)
const form = ref(null)
const errors = ref({})
const formRef = ref()
const required = value => !!String(value ?? '').trim() || 'Ce champ est requis.'
const socialLabels = { facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn' }
const stringLists = [{ key: 'contact_subjects', title: 'Sujets du formulaire de contact' }, { key: 'default_features', title: 'Équipements proposés à la création d’un bien' }]
const operationLabels = { vente: 'Vente', location: 'Location' }
const serverErrors = computed(() => Object.entries(errors.value).map(([key, messages]) => `${key} : ${Array.isArray(messages) ? messages.join(' ') : messages}`))

const load = async () => {
  loading.value = true
  failed.value = false
  try {
    const { data } = await $api('/admin/site-settings')

    form.value = {
      ...data,
      opening_hours: data.opening_hours ?? [],
      office: data.office ?? { latitude: null, longitude: null },
      socials: { facebook: null, instagram: null, linkedin: null, ...data.socials },
      contact_subjects: data.contact_subjects ?? [],
      default_features: data.default_features ?? [],
      property_type_cards: data.property_type_cards ?? [],
      budgets_by_operation: { vente: [], location: [], ...data.budgets_by_operation },
      map_price_ranges: data.map_price_ranges ?? [],
    }
  } catch (error) {
    failed.value = true
    notify.fromError(error, 'Les paramètres du site n’ont pas pu être chargés.')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const numeric = value => value === '' || value === null || value === undefined ? null : Number(value)

const save = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid || saving.value) return
  saving.value = true
  errors.value = {}
  try {
    const payload = structuredClone(toRaw(form.value))

    payload.office = { latitude: numeric(payload.office.latitude), longitude: numeric(payload.office.longitude) }
    payload.socials = Object.fromEntries(Object.entries(payload.socials).map(([key, value]) => [key, value?.trim() || null]))
    for (const operation of ['vente', 'location']) {
      payload.budgets_by_operation[operation] = payload.budgets_by_operation[operation].map(row => ({ label: row.label, min: numeric(row.min), max: numeric(row.max) }))
    }
    await $api('/admin/site-settings', { method: 'PATCH', body: payload })
    notify.success('Paramètres du site enregistrés.')
  } catch (error) {
    const validation = error?.response?._data?.errors
    if (validation && !Array.isArray(validation)) errors.value = validation
    else notify.fromError(error, 'Les paramètres n’ont pas pu être enregistrés.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <h4 class="text-h4 mb-1">Paramètres du site</h4>
    <p class="text-body-1 text-medium-emphasis mb-6">Coordonnées et options proposées sur le site utilisateur. Les modifications sont enregistrées dans le backend.</p>
    <VProgressLinear v-if="loading" indeterminate aria-label="Chargement des paramètres" />
    <VAlert v-else-if="failed" type="error" variant="tonal">Impossible de charger les paramètres. <VBtn variant="text" @click="load">Réessayer</VBtn></VAlert>
    <VForm v-else-if="form" ref="formRef" :disabled="saving" @submit.prevent="save">
      <VAlert v-if="serverErrors.length" type="error" variant="tonal" class="mb-6" role="alert"><p>Corrigez les champs suivants :</p><ul class="ps-5"><li v-for="message in serverErrors" :key="message">{{ message }}</li></ul></VAlert>
      <VCard title="Identité et coordonnées" class="mb-6"><VCardText><VRow>
        <VCol cols="12" md="6"><AppTextField v-model="form.name" label="Nom du site" :rules="[required]" :error-messages="errors.name" /></VCol>
        <VCol cols="12" md="6"><AppTextField v-model="form.tagline" label="Présentation courte" :error-messages="errors.tagline" /></VCol>
        <VCol cols="12" md="6"><AppTextField v-model="form.email" label="Adresse e-mail de contact" type="email" :rules="[required]" :error-messages="errors.email" /></VCol>
        <VCol cols="12" md="6"><AppTextField v-model="form.phone" label="Téléphone" :error-messages="errors.phone" /></VCol>
        <VCol cols="12"><AppTextField v-model="form.address" label="Adresse" :error-messages="errors.address" /></VCol>
        <VCol cols="12" md="6"><AppTextField v-model="form.office.latitude" label="Latitude du bureau" type="number" step="any" min="-90" max="90" :rules="[required]" :error-messages="errors['office.latitude']" /></VCol>
        <VCol cols="12" md="6"><AppTextField v-model="form.office.longitude" label="Longitude du bureau" type="number" step="any" min="-180" max="180" :rules="[required]" :error-messages="errors['office.longitude']" /></VCol>
        <VCol v-for="(label, key) in socialLabels" :key="key" cols="12" md="4"><AppTextField v-model="form.socials[key]" :label="label" type="url" placeholder="https://…" :error-messages="errors[`socials.${key}`]" /></VCol>
      </VRow></VCardText></VCard>
      <VCard title="Horaires" class="mb-6"><VCardText>
        <VRow v-for="(row, index) in form.opening_hours" :key="index" class="align-center">
          <VCol cols="12" md="5"><AppTextField v-model="row.days" label="Jours" :rules="[required]" /></VCol>
          <VCol cols="10" md="5"><AppTextField v-model="row.hours" label="Horaires" :rules="[required]" /></VCol>
          <VCol cols="2"><VBtn icon="tabler-trash" variant="text" color="error" :aria-label="`Retirer l’horaire ${index + 1}`" @click="form.opening_hours.splice(index, 1)" /></VCol>
        </VRow>
        <VBtn class="mt-4" variant="tonal" @click="form.opening_hours.push({ days: '', hours: '' })">Ajouter une plage horaire</VBtn>
      </VCardText></VCard>
      <VCard v-for="group in stringLists" :key="group.key" :title="group.title" class="mb-6"><VCardText>
        <div v-for="(_, index) in form[group.key]" :key="index" class="d-flex gap-2 align-start mb-3">
          <AppTextField v-model="form[group.key][index]" :label="`Libellé ${index + 1}`" :rules="[required]" />
          <VBtn icon="tabler-trash" variant="text" color="error" :aria-label="`Retirer le libellé ${index + 1}`" @click="form[group.key].splice(index, 1)" />
        </div>
        <VBtn variant="tonal" @click="form[group.key].push('')">Ajouter un libellé</VBtn>
      </VCardText></VCard>
      <VCard title="Cartes de types de biens sur l’accueil" class="mb-6"><VCardText>
        <VCard v-for="(row, index) in form.property_type_cards" :key="index" variant="outlined" class="mb-4"><VCardText><VRow>
          <VCol cols="12" md="6"><AppTextField v-model="row.label" label="Titre de la carte" :rules="[required]" /></VCol>
          <VCol cols="12" md="6"><AppTextField v-model="row.category" label="Nom exact de la catégorie du catalogue" :rules="[required]" /></VCol>
          <VCol cols="12"><AppTextField v-model="row.caption" label="Description courte" :rules="[required]" /></VCol>
          <VCol cols="12"><AppTextField v-model="row.image" label="Adresse de l’image" type="url" :rules="[required]" /></VCol>
        </VRow><VBtn class="mt-3" color="error" variant="text" @click="form.property_type_cards.splice(index, 1)">Retirer cette carte</VBtn></VCardText></VCard>
        <VBtn variant="tonal" @click="form.property_type_cards.push({ label: '', caption: '', category: '', image: '' })">Ajouter une carte</VBtn>
      </VCardText></VCard>
      <VCard v-for="(label, operation) in operationLabels" :key="operation" :title="`Budgets suggérés — ${label}`" class="mb-6"><VCardText>
        <VRow v-for="(row, index) in form.budgets_by_operation[operation]" :key="index" class="align-center">
          <VCol cols="12" md="5"><AppTextField v-model="row.label" label="Libellé" :rules="[required]" /></VCol>
          <VCol cols="5" md="3"><AppTextField v-model="row.min" label="Minimum (FCFA)" type="number" min="0" /></VCol>
          <VCol cols="5" md="3"><AppTextField v-model="row.max" label="Maximum (FCFA)" type="number" min="0" /></VCol>
          <VCol cols="2" md="1"><VBtn icon="tabler-trash" color="error" variant="text" :aria-label="`Retirer le budget ${index + 1}`" @click="form.budgets_by_operation[operation].splice(index, 1)" /></VCol>
        </VRow>
        <VBtn class="mt-4" variant="tonal" @click="form.budgets_by_operation[operation].push({ label: '', min: null, max: null })">Ajouter un budget</VBtn>
      </VCardText></VCard>
      <VCard title="Tranches de prix sur la carte" class="mb-6"><VCardText>
        <p class="text-body-2 text-medium-emphasis">Une valeur vide signifie « tous les prix ». Utilisez minimum-maximum, par exemple 100000-500000. Une borne peut rester vide.</p>
        <VRow v-for="(row, index) in form.map_price_ranges" :key="index" class="align-center">
          <VCol cols="12" md="5"><AppTextField v-model="row.label" label="Libellé" :rules="[required]" /></VCol>
          <VCol cols="10" md="5"><AppTextField v-model="row.value" label="Minimum-maximum" /></VCol>
          <VCol cols="2"><VBtn icon="tabler-trash" color="error" variant="text" :aria-label="`Retirer la tranche ${index + 1}`" @click="form.map_price_ranges.splice(index, 1)" /></VCol>
        </VRow>
        <VBtn class="mt-4" variant="tonal" @click="form.map_price_ranges.push({ label: '', value: '' })">Ajouter une tranche de prix</VBtn>
      </VCardText></VCard>
      <div class="d-flex gap-3 mb-6"><VBtn type="submit" :loading="saving">Enregistrer les paramètres</VBtn></div>
    </VForm>
  </div>
</template>
