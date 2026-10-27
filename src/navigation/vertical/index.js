/**
 * Menu de l'espace d'administration DASpace.
 *
 * Chaque entree correspond a un ecran branche sur les routes /admin de l'API.
 * Aucune entree ne porte de couple action/sujet : l'espace est reserve aux
 * administrateurs, qui recoivent tous les droits (voir utils/session.js).
 */
export default [
  {
    title: 'Tableau de bord',
    icon: { icon: 'tabler-layout-dashboard' },
    to: 'dashboard',
  },
  { heading: 'Validation' },
  {
    title: 'Demandes annonceur',
    icon: { icon: 'tabler-building-estate' },
    to: 'advertiser-requests',
  },
  {
    title: 'Annonces',
    icon: { icon: 'tabler-home-check' },
    to: 'properties',
  },
  { heading: 'Plateforme' },
  {
    title: 'Utilisateurs',
    icon: { icon: 'tabler-users' },
    to: 'users',
  },
  {
    title: 'Catégories',
    icon: { icon: 'tabler-category' },
    to: 'categories',
  },
  { heading: 'Supervision' },
  {
    title: 'Signalements',
    icon: { icon: 'tabler-flag' },
    to: 'reports',
  },
  {
    title: 'Messages de contact',
    icon: { icon: 'tabler-mail' },
    to: 'contact-requests',
  },
  {
    title: 'Paiements',
    icon: { icon: 'tabler-cash' },
    to: 'payments',
  },
  {
    title: 'Journal des actions',
    icon: { icon: 'tabler-history' },
    to: 'history',
  },
]
