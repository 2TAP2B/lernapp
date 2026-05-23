<template>
  <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 font-bold text-sm">
    <Flame class="w-4 h-4" />
    <span>{{ days }} {{ days === 1 ? 'Tag' : 'Tage' }}</span>
  </div>
</template>

<script setup lang="ts">
import { Flame } from '@lucide/vue'

defineProps<{ days: number }>()
</script>
