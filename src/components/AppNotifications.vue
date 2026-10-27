<script setup>
const { notifications, dismiss } = useNotify()

const icons = {
  success: 'tabler-circle-check',
  error: 'tabler-alert-circle',
  warning: 'tabler-alert-triangle',
  secondary: 'tabler-info-circle',
}
</script>

<template>
  <!--
    Teleported to the body so that a bubble raised from inside a dialog still
    shows above it.
  -->
  <Teleport to="body">
    <div class="app-notifications">
      <TransitionGroup name="app-notification">
        <VAlert
          v-for="notification in notifications"
          :key="notification.id"
          :color="notification.type"
          variant="elevated"
          elevation="8"
          :icon="icons[notification.type]"
          class="app-notification"
          role="status"
          aria-live="polite"
        >
          {{ notification.text }}
          <template #append>
            <IconBtn
              size="small"
              aria-label="Fermer"
              @click="dismiss(notification.id)"
            >
              <VIcon icon="tabler-x" />
            </IconBtn>
          </template>
        </VAlert>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.app-notifications {
  position: fixed;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  inline-size: min(440px, calc(100vw - 32px));
  inset-block-start: 1rem;
  inset-inline-end: 1rem;
  pointer-events: none;
}

.app-notification {
  pointer-events: auto;
}

.app-notification-enter-active,
.app-notification-leave-active {
  transition: all 0.25s ease;
}

.app-notification-enter-from,
.app-notification-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
