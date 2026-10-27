<script setup>
definePage({
  meta: {
    layout: 'blank',

    // Publique : c'est la page vers laquelle le garde renvoie un refus. La
    // soumettre au controle d'acces produirait une redirection en boucle.
    public: true,
  },
})

const router = useRouter()
const ability = useAbility()

const switchAccount = async () => {
  await closeSession(ability)
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="d-flex align-center justify-center text-center pa-6 not-authorized">
    <div style="max-inline-size: 34rem;">
      <VIcon
        icon="tabler-lock"
        size="56"
        color="primary"
        class="mb-6"
      />

      <h1 class="text-h4 mb-3">
        Cette page ne vous est pas accessible
      </h1>

      <p class="text-body-1 text-medium-emphasis mb-2">
        L'espace d'administration est réservé aux comptes administrateurs de DASpace.
      </p>

      <p class="text-body-2 text-medium-emphasis mb-8">
        Connectez-vous avec un compte administrateur pour continuer.
      </p>

      <VBtn
        variant="elevated"
        prepend-icon="tabler-logout"
        @click="switchAccount"
      >
        Changer de compte
      </VBtn>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.not-authorized {
  // La mise en page « blank » n'impose aucune hauteur : sans cela le bloc
  // resterait colle en haut de l'ecran.
  min-block-size: 100dvh;
}
</style>
