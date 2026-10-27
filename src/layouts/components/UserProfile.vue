<script setup>
const router = useRouter()
const ability = useAbility()

const userData = useCookie('userData')
const avatarRef = ref(null)

const initials = computed(() => (userData.value?.name ?? '')
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map(part => part[0].toUpperCase())
  .join(''))

const logout = async () => {
  await closeSession(ability)
  await router.push({ name: 'login' })
}
</script>

<template>
  <div v-if="userData">
    <VAvatar
      ref="avatarRef"
      size="38"
      class="cursor-pointer"
      color="primary"
      variant="tonal"
    >
      <VImg
        v-if="userData.photo"
        :src="userData.photo"
      />
      <span v-else-if="initials">{{ initials }}</span>
      <VIcon
        v-else
        icon="tabler-user"
      />
    </VAvatar>

    <VMenu
      :activator="avatarRef"
      width="260"
      location="bottom end"
      offset="12px"
    >
      <VList>
        <VListItem>
          <div class="d-flex gap-2 align-center">
            <VAvatar
              color="primary"
              variant="tonal"
            >
              <span v-if="initials">{{ initials }}</span>
              <VIcon
                v-else
                icon="tabler-user"
              />
            </VAvatar>
            <div>
              <h6 class="text-h6 font-weight-medium">
                {{ userData.name }}
              </h6>
              <VListItemSubtitle class="text-disabled">
                {{ userData.email }}
              </VListItemSubtitle>
            </div>
          </div>
        </VListItem>

        <VDivider class="my-2" />

        <div class="px-4 py-2">
          <VBtn
            block
            size="small"
            color="error"
            append-icon="tabler-logout"
            @click="logout"
          >
            Se déconnecter
          </VBtn>
        </div>
      </VList>
    </VMenu>
  </div>
</template>
