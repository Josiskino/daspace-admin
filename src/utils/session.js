/**
 * Session de l'espace d'administration.
 *
 * L'API n'expose pas de droits fins : l'acces aux routes /admin repose sur le
 * seul role `admin`. Le client se contente donc d'une regle unique, accordee
 * aux administrateurs, que CASL applique au menu comme aux routes.
 */

export const ADMIN_ROLE = 'admin'

const ADMIN_ABILITY_RULES = [{ action: 'manage', subject: 'all' }]

export const isAdmin = user => user?.role === ADMIN_ROLE && user?.status !== 'bloque'

export const abilityRulesFor = user => (isAdmin(user) ? ADMIN_ABILITY_RULES : [])

/** Ouvre la session renvoyee par /auth/login et applique les droits. */
export const storeSession = async ({ token, user }, ability) => {
  useCookie('accessToken').value = token
  useCookie('userData').value = user

  // useCookie n'ecrit document.cookie qu'au tick suivant : sans cette attente,
  // le prochain appel partirait encore sans jeton.
  await nextTick()

  ability?.update(abilityRulesFor(user))
}

/** Ferme la session cote API puis efface les traces locales. */
export const closeSession = async ability => {
  try {
    if (useCookie('accessToken').value)
      await $api('/auth/logout', { method: 'POST' })
  } catch {
    // Un jeton deja revoque ne doit pas empecher la deconnexion locale.
  }

  useCookie('accessToken').value = null
  useCookie('userData').value = null
  ability?.update([])
}
