<script setup>
import { useTheme } from 'vuetify'
import ScrollToTop from '@core/components/ScrollToTop.vue'
import initCore from '@core/initCore'
import {
  initConfigStore,
  useConfigStore,
} from '@core/stores/config'
import { hexToRgb } from '@core/utils/colorConverter'

const { global } = useTheme()

// ℹ️ Sync current theme with initial loader theme
initCore()
initConfigStore()

// Le profil est relu au demarrage : un administrateur bloque ou retrograde
// depuis sa derniere visite perd aussitot l'acces a l'espace.
const ability = useAbility()
const router = useRouter()

onMounted(async () => {
  if (!useCookie('accessToken').value) return

  try {
    const me = await $api('/auth/me')

    useCookie('userData').value = me.data
    ability.update(abilityRulesFor(me.data))

    if (!isAdmin(me.data))
      router.replace({ name: 'not-authorized' })
  } catch {
    // Jeton expire : $api purge la session et renvoie vers la connexion.
  }
})

const configStore = useConfigStore()
</script>

<template>
  <VLocaleProvider :rtl="configStore.isAppRTL">
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <VApp :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`">
      <RouterView />
      <ScrollToTop />
      <AppNotifications />
    </VApp>
  </VLocaleProvider>
</template>
