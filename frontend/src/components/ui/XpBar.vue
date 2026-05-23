<template>
  <div class="xp-bar-wrapper">
    <div class="flex items-center justify-between mb-1 text-sm font-bold text-indigo-700 dark:text-indigo-300">
      <span>Level {{ level }}</span>
      <span>{{ xp }} / {{ nextLevelXp }} XP</span>
    </div>
    <div class="h-4 rounded-full bg-indigo-100 dark:bg-indigo-900 overflow-hidden">
      <div
        ref="barRef"
        class="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all duration-700"
        :style="{ width: progress + '%' }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { gsap } from 'gsap'

const props = defineProps<{ level: number; xp: number; nextLevelXp: number; progress: number }>()

const barRef = ref<HTMLElement | null>(null)

watch(
  () => props.progress,
  (newVal, oldVal) => {
    if (!barRef.value) return
    gsap.fromTo(barRef.value, { width: oldVal + '%' }, { width: newVal + '%', duration: 0.8, ease: 'power2.out' })
  }
)
</script>
