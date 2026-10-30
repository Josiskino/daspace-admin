/**
 * Mise en forme commune aux ecrans d'administration.
 *
 * L'API renvoie les statuts sous leur valeur brute (en_attente, validee...) :
 * leur libelle et leur couleur sont centralises ici pour que chaque ecran les
 * affiche de la meme facon.
 */

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' })
const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
const numberFormatter = new Intl.NumberFormat('fr-FR')

export const formatDate = value => (value ? dateFormatter.format(new Date(value)) : '—')

export const formatDateTime = value => (value ? dateTimeFormatter.format(new Date(value)) : '—')

export const formatNumber = value => numberFormatter.format(Number(value ?? 0))

export const formatMoney = (value, currency = 'XOF') => `${formatNumber(value)} ${currency === 'XOF' ? 'FCFA' : currency}`

export const STATUS = {
  advertiserRequest: {
    en_attente: { label: 'En attente', color: 'warning' },
    acceptee: { label: 'Acceptée', color: 'success' },
    refusee: { label: 'Refusée', color: 'error' },
  },
  property: {
    en_attente: { label: 'En attente', color: 'warning' },
    validee: { label: 'Validée', color: 'success' },
    refusee: { label: 'Refusée', color: 'error' },
    suspendue: { label: 'Suspendue', color: 'secondary' },
    vendue: { label: 'Vendue', color: 'info' },
    louee: { label: 'Louée', color: 'info' },
  },
  user: {
    actif: { label: 'Actif', color: 'success' },
    bloque: { label: 'Bloqué', color: 'error' },
  },
  report: {
    en_attente: { label: 'En attente', color: 'warning' },
    traite: { label: 'Traité', color: 'success' },
  },
  contactRequest: {
    nouveau: { label: 'Nouveau', color: 'info' },
    en_cours: { label: 'En cours', color: 'warning' },
    traite: { label: 'Traité', color: 'success' },
  },
  payment: {
    en_attente: { label: 'En attente', color: 'warning' },
    reussi: { label: 'Réussi', color: 'success' },
    echoue: { label: 'Échoué', color: 'error' },
  },
}

export const ROLES = {
  admin: { label: 'Administrateur', color: 'primary' },
  proprietaire: { label: 'Gestionnaire', color: 'info' },
  client: { label: 'Client', color: 'secondary' },
}

export const statusOf = (kind, value) => STATUS[kind]?.[value] ?? { label: value ?? '—', color: 'secondary' }

export const statusOptions = kind => Object.entries(STATUS[kind] ?? {}).map(([value, { label }]) => ({ value, title: label }))

export const roleOf = value => ROLES[value] ?? { label: value ?? '—', color: 'secondary' }
