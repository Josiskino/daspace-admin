import { ofetch } from 'ofetch'

/**
 * Appends ngrok bypass query param so <img> tags can load media in dev.
 * In production the URL is returned unchanged.
 */
export const toMediaUrl = url => {
  if (!url) return url
  if (!import.meta.env.DEV) return url

  try {
    const apiOrigin = new URL(import.meta.env.VITE_API_BASE_URL).origin
    if (url.startsWith(apiOrigin)) {
      return `${url}?ngrok-skip-browser-warning=true`
    }
  } catch {}

  return url
}

/** Efface la session sans passer par useCookie : ce code vit hors composant. */
const clearSession = () => {
  for (const name of ['accessToken', 'userData'])
    document.cookie = `${name}=; Max-Age=0; path=/`
}

export const $api = ofetch.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  async onRequest({ options }) {
    const accessToken = useCookie('accessToken').value

    options.headers = {
      ...options.headers,
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json',
    }

    if (accessToken) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      }
    }
  },

  /**
   * Un 401 signifie que le jeton n'est plus valide (base recreee, jeton
   * revoque...) : la session est purgee et l'administrateur renvoye vers la
   * page de connexion avec le motif de l'expiration.
   */
  onResponseError({ request, response }) {
    if (response?.status !== 401)
      return

    // La connexion elle-meme repond 401 sur un mot de passe errone : la
    // deconnecter et la recharger effacerait le message d'erreur.
    const url = typeof request === 'string' ? request : request?.url ?? ''
    if (url.includes('/auth/login'))
      return

    clearSession()

    /*
     * La redirection ne vaut que pour les appels declenches hors navigation —
     * un clic sur un bouton, par exemple. Pendant une navigation, le garde de
     * route constate la session purgee et redirige lui-meme : deux
     * redirections concurrentes laissaient gagner la plus rapide, et l'URL
     * perdait alors le motif de l'expiration.
     */
    if (!window.location.pathname.startsWith('/login'))
      setTimeout(() => {
        if (!window.location.pathname.startsWith('/login'))
          window.location.href = '/login?session=expired'
      }, 400)
  },
})
