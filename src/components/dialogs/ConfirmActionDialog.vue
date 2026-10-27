<!--
  Confirmation d'une action d'administration : la decision reste ouverte
  pendant l'appel a l'API, et le bouton affiche son chargement.
-->
<script setup>
const props = defineProps({
  isDialogVisible: { type: Boolean, required: true },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirmer' },
  confirmColor: { type: String, default: 'primary' },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:isDialogVisible', 'confirm'])

const close = () => {
  if (!props.loading) emit('update:isDialogVisible', false)
}
</script>

<template>
  <VDialog
    :model-value="props.isDialogVisible"
    max-width="460"
    @update:model-value="close"
  >
    <VCard>
      <VCardText class="pa-6">
        <h5 class="text-h5 mb-2">
          {{ props.title }}
        </h5>
        <p
          v-if="props.message"
          class="text-body-1 text-medium-emphasis mb-0"
        >
          {{ props.message }}
        </p>
        <slot />
      </VCardText>

      <VCardActions class="px-6 pb-6 pt-0">
        <VSpacer />
        <VBtn
          variant="tonal"
          color="secondary"
          :disabled="props.loading"
          @click="close"
        >
          Annuler
        </VBtn>
        <VBtn
          variant="elevated"
          :color="props.confirmColor"
          :loading="props.loading"
          @click="emit('confirm')"
        >
          {{ props.confirmLabel }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
