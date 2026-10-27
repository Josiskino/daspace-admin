<!--
  Barre de filtres commune aux listes : recherche, filtres propres a l'ecran
  (slot par defaut) et periode optionnelle.
-->
<script setup>
const props = defineProps({
  searchPlaceholder: { type: String, default: 'Rechercher...' },
  withPeriod: { type: Boolean, default: false },

  // Vrai quand un filtre du slot (statut, type...) est renseigne.
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['reset'])
const search = defineModel('search', { type: String, default: '' })
const from = defineModel('from', { type: String, default: null })
const to = defineModel('to', { type: String, default: null })

const hasActiveFilter = computed(() => props.active || !!(search.value || from.value || to.value))

const reset = () => {
  search.value = ''
  from.value = null
  to.value = null
  emit('reset')
}
</script>

<template>
  <VCardText>
    <VRow>
      <slot />
      <VCol
        cols="12"
        :md="props.withPeriod ? 4 : 6"
      >
        <AppTextField
          v-model="search"
          :placeholder="props.searchPlaceholder"
          prepend-inner-icon="tabler-search"
          clearable
        />
      </VCol>
      <template v-if="props.withPeriod">
        <VCol
          cols="6"
          md="2"
        >
          <AppTextField
            v-model="from"
            type="date"
            placeholder="Du"
            :max="to || undefined"
            clearable
          />
        </VCol>
        <VCol
          cols="6"
          md="2"
        >
          <AppTextField
            v-model="to"
            type="date"
            placeholder="Au"
            :min="from || undefined"
            clearable
          />
        </VCol>
      </template>
      <VCol
        v-if="hasActiveFilter"
        cols="12"
        class="pt-0"
      >
        <VBtn
          size="small"
          variant="text"
          prepend-icon="tabler-filter-off"
          @click="reset"
        >
          Réinitialiser les filtres
        </VBtn>
      </VCol>
    </VRow>
  </VCardText>
</template>
