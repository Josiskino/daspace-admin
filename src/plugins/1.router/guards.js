export const setupGuards = router => {
  router.beforeEach(to => {
    // Pages ouvertes a tous : erreurs, refus d'acces.
    if (to.meta.public)
      return

    const userData = useCookie('userData').value
    const isLoggedIn = !!(userData && useCookie('accessToken').value)

    if (to.meta.unauthenticatedOnly)
      return isLoggedIn ? '/' : undefined

    if (!isLoggedIn) {
      return {
        name: 'login',
        query: { to: to.fullPath !== '/' ? to.fullPath : undefined },
      }
    }

    // L'API refusera de toute facon les routes /admin a un autre role : mieux
    // vaut le dire tout de suite qu'afficher des ecrans vides.
    if (!isAdmin(userData))
      return { name: 'not-authorized' }
  })
}
