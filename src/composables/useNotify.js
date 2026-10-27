/**
 * Notifications shown as bubbles pinned to the top of the screen.
 *
 * A message stays until the user closes it.
 *
 * The list lives at module level so that any page, dialog or component can
 * notify without passing the message up to the layout.
 */

const MAX_VISIBLE = 4

// Une confirmation se lit d'un coup d'oeil ; une erreur reste jusqu'a ce que
// l'administrateur la ferme.
const AUTO_DISMISS_MS = 5000

const notifications = ref([])

let sequence = 0

const push = (type, text) => {
  if (!text) return

  // The same message twice in a row says nothing more: it only pushes the
  // others out of sight.
  if (notifications.value.some(notification => notification.text === text && notification.type === type)) return

  const id = ++sequence

  notifications.value = [...notifications.value, { id, type, text }].slice(-MAX_VISIBLE)

  if (type === 'success' || type === 'secondary')
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
}

const dismiss = id => {
  notifications.value = notifications.value.filter(notification => notification.id !== id)
}

/**
 * Message carried by an API error: the first field error when there is one,
 * otherwise the server's message, otherwise the given fallback.
 */
const errorMessage = (error, fallback) => {
  const data = error?.response?._data
  const first = data?.errors && !Array.isArray(data.errors) ? Object.values(data.errors).flat().find(value => typeof value === 'string') : null

  // Le middleware de role repond { erreur } plutot que { message }.
  return first ?? data?.message ?? data?.erreur ?? fallback
}

export const useNotify = () => ({
  notifications: readonly(notifications),
  success: text => push('success', text),
  error: text => push('error', text),
  warning: text => push('warning', text),
  info: text => push('secondary', text),
  fromError: (error, fallback) => push('error', errorMessage(error, fallback)),
  dismiss,
  clear: () => { notifications.value = [] },
})
