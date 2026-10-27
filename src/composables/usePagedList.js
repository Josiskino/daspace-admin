/**
 * Liste paginee par l'API, filtree cote serveur.
 *
 * Un changement de filtre ramene a la premiere page ; la recherche texte
 * attend la fin de la frappe pour ne pas lancer un appel par lettre. Les
 * filtres vides ne sont pas envoyes.
 *
 * @param {string} path route de l'API (ex. '/admin/payments')
 * @param {object} filters objet reactif des filtres ; `search` est temporise
 * @param {string} errorText message affiche si le chargement echoue
 */
export const usePagedList = (path, filters, errorText) => {
  const notify = useNotify()

  const items = ref([])
  const total = ref(0)
  const isLoading = ref(false)
  const options = ref({ page: 1, itemsPerPage: 20 })

  const load = async () => {
    isLoading.value = true

    const query = Object.fromEntries(
      Object.entries({ ...filters, page: options.value.page })
        .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
        .filter(([, value]) => value !== null && value !== undefined && value !== ''),
    )

    try {
      const res = await $api(path, { query })

      items.value = res.data ?? []
      total.value = res.meta?.total ?? 0
      options.value.itemsPerPage = res.meta?.per_page ?? options.value.itemsPerPage
    } catch (err) {
      notify.fromError(err, errorText)
    } finally {
      isLoading.value = false
    }
  }

  const resetPage = () => {
    if (options.value.page === 1) load()
    else options.value.page = 1
  }

  const { search, ...others } = toRefs(filters)

  watch(Object.values(others), resetPage)
  if (search) watchDebounced(search, resetPage, { debounce: 400 })
  watch(() => options.value.page, load, { immediate: true })

  return { items, total, isLoading, options, load }
}
