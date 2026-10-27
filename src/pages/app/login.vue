<script setup>
import { VForm } from 'vuetify/components/VForm'
import authV1BottomShape from '@images/svg/auth-v1-bottom-shape.svg?raw'
import authV1TopShape from '@images/svg/auth-v1-top-shape.svg?raw'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

const isPasswordVisible = ref(false)
const route = useRoute()
const router = useRouter()
const ability = useAbility()

const errors = ref({
  email: undefined,
  password: undefined,
})

const isSubmitting = ref(false)

/**
 * Redirect from the API interceptor after a 401. A modal interrupts reading,
 * where a banner in the form was mistaken for an input error.
 */
const sessionExpired = ref(route.query.session === 'expired')

const dismissSessionNotice = () => {
  sessionExpired.value = false

  // The parameter is removed from the URL: otherwise the modal would come back
  // on every reload, long after the user acknowledged it.
  router.replace({ query: { ...route.query, session: undefined } })
}

const refVForm = ref()

const credentials = ref({
  email: '',
  password: '',
})

const login = async () => {
  if (isSubmitting.value) return

  errors.value = { email: undefined, password: undefined }
  isSubmitting.value = true

  try {
    const res = await $api('/auth/login', {
      method: 'POST',
      body: {
        email: credentials.value.email,
        password: credentials.value.password,
        device_name: 'daspace-admin',
      },
    })

    await storeSession(res.data, ability)

    // Un proprietaire ou un client a de vrais identifiants, mais l'API lui
    // refusera chaque ecran : la session est refermee aussitot.
    if (!isAdmin(res.data.user)) {
      await closeSession(ability)
      errors.value = { email: 'Ce compte n\'a pas accès à l\'espace d\'administration.' }

      return
    }

    await router.replace(route.query.to ? String(route.query.to) : landingRoute())
  } catch (err) {
    const data = err?.response?._data
    const fieldErrors = data?.errors && !Array.isArray(data.errors) ? data.errors : null

    if (fieldErrors && Object.keys(fieldErrors).length)
      errors.value = fieldErrors
    else
      errors.value = { email: data?.message ?? 'Connexion impossible. Réessayez dans un instant.' }
  } finally {
    isSubmitting.value = false
  }
}

const onSubmit = () => {
  refVForm.value?.validate().then(({ valid: isValid }) => {
    if (isValid)
      login()
  })
}

const onPasswordPaste = event => {
  event.preventDefault()

  const pasted = event.clipboardData?.getData('text').trim() ?? ''

  credentials.value.password = pasted
  nextTick(() => {
    const input = event.target

    input.setSelectionRange(pasted.length, pasted.length)
  })
}
</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <div class="position-relative my-sm-16">
      <!-- 👉 Top shape -->
      <VNodeRenderer
        :nodes="h('div', { innerHTML: authV1TopShape })"
        class="text-primary auth-v1-top-shape d-none d-sm-block"
      />

      <!-- 👉 Bottom shape -->
      <VNodeRenderer
        :nodes="h('div', { innerHTML: authV1BottomShape })"
        class="text-primary auth-v1-bottom-shape d-none d-sm-block"
      />

      <!-- 👉 Auth Card -->
      <VCard
        class="auth-card"
        max-width="460"
        :class="$vuetify.display.smAndUp ? 'pa-6' : 'pa-0'"
      >
        <VCardItem class="justify-center">
          <VCardTitle>
            <RouterLink to="/">
              <div class="app-logo">
                <VNodeRenderer :nodes="themeConfig.app.logo" />
                <h1 class="app-logo-title">
                  {{ themeConfig.app.title }}
                </h1>
              </div>
            </RouterLink>
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <h5 class="text-h5 mb-1">
            Espace d'administration
          </h5>
          <p class="text-body-2 mb-0">
            Supervision de la plateforme DASpace
          </p>
        </VCardText>

        <VCardText>
          <VForm
            ref="refVForm"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <!-- email -->
              <VCol cols="12">
                <AppTextField
                  v-model="credentials.email"
                  autofocus
                  label="Adresse e-mail"
                  type="email"
                  placeholder="admin@daspace.com"
                  :rules="[requiredValidator, emailValidator]"
                  :error-messages="errors.email"
                  validate-on="blur"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField
                  v-model="credentials.password"
                  label="Mot de passe"
                  placeholder="············"
                  :rules="[requiredValidator]"
                  validate-on="blur"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :error-messages="errors.password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  @paste="onPasswordPaste"
                />

                <VBtn
                  block
                  type="submit"
                  class="mt-6"
                  :loading="isSubmitting"
                  :disabled="isSubmitting"
                >
                  {{ isSubmitting ? 'Connexion...' : 'Se connecter' }}
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </div>

    <VDialog
      v-model="sessionExpired"
      max-width="440"
      persistent
    >
      <VCard>
        <VCardText class="text-center pa-8">
          <VIcon
            icon="tabler-clock-exclamation"
            size="48"
            color="warning"
            class="mb-4"
          />

          <h5 class="text-h5 mb-2">
            Votre session a expiré
          </h5>

          <p class="text-body-2 text-medium-emphasis mb-0">
            Pour votre sécurité, la connexion a été fermée. Saisissez à nouveau vos identifiants pour reprendre où vous en étiez.
          </p>
        </VCardText>

        <VCardActions class="px-8 pb-6 pt-0">
          <VBtn
            block
            variant="elevated"
            @click="dismissSessionNotice"
          >
            Se reconnecter
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>

<style lang="scss" scoped>
.app-logo :deep(svg) {
  block-size: 40px;
  inline-size: 40px;
}
</style>
