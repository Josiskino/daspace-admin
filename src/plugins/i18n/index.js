import { createI18n } from 'vue-i18n'
import { cookieRef } from '@layouts/stores/config'
import { themeConfig } from '@themeConfig'

const messages = Object.fromEntries(Object.entries(import.meta.glob('./locales/*.json', { eager: true }))
  .map(([key, value]) => [key.slice(10, -5), value.default]))

let _i18n = null
export const getI18n = () => {
  if (_i18n === null) {
    _i18n = createI18n({
      legacy: false,
      locale: cookieRef('language', themeConfig.app.i18n.defaultLocale).value,
      fallbackLocale: 'en',
      messages,

      // Navigation titles are written in French directly rather than as
      // message keys; the raw title is the intended output, not a miss.
      missingWarn: false,
      fallbackWarn: false,
    })
  }
  
  return _i18n
}
export default function (app) {
  app.use(getI18n())
}
