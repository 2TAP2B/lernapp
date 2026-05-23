<template>
  <RouterView />
  <BadgeNotification />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useFlagStore } from '@/stores/flagStore'
import BadgeNotification from '@/components/gamification/BadgeNotification.vue'

const userStore = useUserStore()
const flagStore = useFlagStore()

onMounted(async () => {
  await userStore.initialize()
  await flagStore.loadCountries()
  if (userStore.isLoggedIn) {
    await flagStore.loadProgress()
  }
})
</script>
