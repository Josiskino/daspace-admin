export const redirects = [
  {
    path: '/',
    name: 'index',
    redirect: to => (useCookie('userData').value
      ? landingRoute()
      : { name: 'login', query: to.query }),
  },
]

export const routes = []
