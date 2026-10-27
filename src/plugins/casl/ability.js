import { createMongoAbility } from '@casl/ability'

/**
 * Instance unique, partagee entre l'application et le garde de route.
 *
 * Le garde s'execute hors de tout composant : il ne peut pas passer par
 * useAbility(), qui repose sur inject(). Sans cette instance exportee, il
 * evaluerait un jeu de regles distinct de celui des vues.
 */
export const ability = createMongoAbility()
