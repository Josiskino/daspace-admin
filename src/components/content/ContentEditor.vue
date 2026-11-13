<script setup>
import { contentPayload, createContentForm } from '@/utils/contentEditor.mjs'

const props = defineProps({ entry: { type: Object, default: null } })
const emit = defineEmits(['saved', 'cancel'])
const notify = useNotify()
const form = ref(createContentForm(props.entry ?? {}))
const errors = ref({})
const saving = ref(false)
const formRef = ref()
const required = value => !!String(value ?? '').trim() || 'Ce champ est requis.'
const kinds = [{ title: 'Article du blog', value: 'article' }, { title: 'Guide', value: 'guide' }, { title: 'Texte légal', value: 'legal' }]
const states = [{ title: 'Brouillon', value: 'draft' }, { title: 'Publié', value: 'published' }]
const serverErrors = computed(() => Object.entries(errors.value).map(([field, messages]) => `${field} : ${Array.isArray(messages) ? messages.join(' ') : messages}`))
const addSection = () => form.value.sections.push({ id: `section-${Date.now()}`, title: '', paragraphs: [''], checklist: [] })

const moveSection = (index, direction) => {
  const other = index + direction
  if (other < 0 || other >= form.value.sections.length) return

  const sections = form.value.sections

  ;[sections[index], sections[other]] = [sections[other], sections[index]]
}

const save = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid || saving.value) return
  errors.value = {}
  saving.value = true
  try {
    const path = props.entry ? `/admin/content/${props.entry.id}` : '/admin/content'

    await $api(path, { method: props.entry ? 'PATCH' : 'POST', body: contentPayload(form.value) })
    notify.success('Contenu enregistré.')
    emit('saved')
  } catch (error) {
    const validation = error?.response?._data?.errors
    if (validation && !Array.isArray(validation)) errors.value = validation
    else notify.fromError(error, 'Le contenu n’a pas pu être enregistré.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <VForm ref="formRef" @submit.prevent="save">
    <VCard>
      <VCardTitle>{{ entry ? 'Modifier le contenu' : 'Nouveau contenu' }}</VCardTitle>
      <VCardText>
        <VAlert v-if="serverErrors.length" type="error" variant="tonal" class="mb-6" role="alert">
          <p class="mb-2">Corrigez les champs indiqués par le serveur :</p>
          <ul class="ps-5"><li v-for="message in serverErrors" :key="message">{{ message }}</li></ul>
        </VAlert>
        <VRow>
          <VCol cols="12" md="6"><AppSelect v-model="form.kind" label="Type de contenu" :items="kinds" :disabled="!!entry || saving" /></VCol>
          <VCol cols="12" md="6"><AppSelect v-model="form.status" label="Publication" :items="states" :disabled="saving" /></VCol>
          <VCol cols="12"><AppTextField v-model="form.title" label="Titre" :rules="[required]" :error-messages="errors.title" :disabled="saving" /></VCol>
          <VCol cols="12" md="6"><AppTextField v-model="form.slug" label="Identifiant dans l’URL" hint="Lettres minuscules, chiffres et tirets. Modifier cet identifiant change l’adresse publique." persistent-hint :rules="[required]" :error-messages="errors.slug" :disabled="saving" /></VCol>
          <VCol cols="12" md="6"><AppTextField v-model="form.date" label="Date affichée" type="date" :rules="[required]" :error-messages="errors.date" :disabled="saving" /></VCol>
          <VCol cols="12"><AppTextarea v-model="form.summary" label="Résumé" rows="3" :rules="[required]" :error-messages="errors.summary" :disabled="saving" /></VCol>
          <VCol cols="12" md="6"><AppTextField v-model="form.category" label="Catégorie (facultatif)" hint="Les catégories publiées sont proposées automatiquement sur le site." persistent-hint :error-messages="errors.category" :disabled="saving" /></VCol>
          <VCol cols="12" md="6"><AppTextField v-model="form.image" label="Adresse de l’image (facultatif)" hint="URL HTTPS ou chemin public /images/…" persistent-hint :error-messages="errors.image" :disabled="saving" /></VCol>
          <VCol cols="12"><VSwitch v-model="form.is_provisional" label="Texte provisoire — afficher l’avertissement et empêcher l’indexation" color="warning" :disabled="saving" hide-details /></VCol>
        </VRow>
        <VDivider class="my-6" />
        <h5 class="text-h5 mb-2">Sections de lecture</h5>
        <p class="text-body-2 text-medium-emphasis mb-5">Les paragraphes et listes sont du texte simple. Leur ordre ci-dessous est celui du site.</p>
        <VCard v-for="(section, index) in form.sections" :key="index" variant="outlined" class="mb-5">
          <VCardText>
            <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-4">
              <strong>Section {{ index + 1 }}</strong>
              <div class="d-flex gap-1">
                <VBtn size="small" variant="text" :disabled="saving || index === 0" @click="moveSection(index, -1)">Monter</VBtn>
                <VBtn size="small" variant="text" :disabled="saving || index === form.sections.length - 1" @click="moveSection(index, 1)">Descendre</VBtn>
                <VBtn size="small" color="error" variant="text" :disabled="saving || form.sections.length === 1" @click="form.sections.splice(index, 1)">Retirer</VBtn>
              </div>
            </div>
            <AppTextField v-model="section.id" label="Ancre de la section" class="mb-4" :rules="[required]" :error-messages="errors[`sections.${index}.id`]" :disabled="saving" />
            <AppTextField v-model="section.title" label="Titre de la section" class="mb-4" :rules="[required]" :error-messages="errors[`sections.${index}.title`]" :disabled="saving" />
            <div v-for="(_, paragraphIndex) in section.paragraphs" :key="paragraphIndex" class="mb-3">
              <AppTextarea v-model="section.paragraphs[paragraphIndex]" :label="`Paragraphe ${paragraphIndex + 1}`" rows="3" auto-grow :rules="[required]" :error-messages="errors[`sections.${index}.paragraphs.${paragraphIndex}`]" :disabled="saving" />
              <VBtn v-if="section.paragraphs.length > 1" size="small" color="error" variant="text" :disabled="saving" @click="section.paragraphs.splice(paragraphIndex, 1)">Retirer ce paragraphe</VBtn>
            </div>
            <VBtn size="small" variant="tonal" :disabled="saving" @click="section.paragraphs.push('')">Ajouter un paragraphe</VBtn>
            <p class="font-weight-medium mt-5 mb-3">Liste « À garder en tête » (facultative)</p>
            <div v-for="(_, itemIndex) in section.checklist" :key="itemIndex" class="d-flex align-start gap-2 mb-3">
              <AppTextField v-model="section.checklist[itemIndex]" :label="`Point ${itemIndex + 1}`" :rules="[required]" :error-messages="errors[`sections.${index}.checklist.${itemIndex}`]" :disabled="saving" />
              <VBtn icon="tabler-x" variant="text" color="error" :aria-label="`Retirer le point ${itemIndex + 1}`" :disabled="saving" @click="section.checklist.splice(itemIndex, 1)" />
            </div>
            <VBtn size="small" variant="text" :disabled="saving" @click="section.checklist.push('')">Ajouter un point</VBtn>
          </VCardText>
        </VCard>
        <VBtn variant="tonal" prepend-icon="tabler-plus" :disabled="saving" @click="addSection">Ajouter une section</VBtn>
      </VCardText>
      <VDivider />
      <VCardActions class="pa-5 flex-wrap gap-2">
        <VBtn type="submit" variant="elevated" :loading="saving">{{ form.status === 'published' ? 'Enregistrer et publier' : 'Enregistrer le brouillon' }}</VBtn>
        <VBtn variant="text" color="secondary" :disabled="saving" @click="emit('cancel')">Annuler</VBtn>
      </VCardActions>
    </VCard>
  </VForm>
</template>
