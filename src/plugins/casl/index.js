import { abilitiesPlugin } from '@casl/vue'
import { ability } from './ability'

export default function (app) {
  // Les droits sont rejoues depuis le cookie : le garde de route s'execute
  // avant tout montage, et partir d'une liste vide renverrait l'administrateur
  // deja connecte vers la page d'erreur a chaque rechargement.
  ability.update(abilityRulesFor(useCookie('userData').value))

  app.use(abilitiesPlugin, ability, {
    useGlobalProperties: true,
  })
}
