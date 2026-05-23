<template>
  <div
    class="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md select-none"
    :class="bgClass"
  >
    {{ avatarEmojis[avatarId] ?? '🐶' }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ avatarId: number; size?: 'sm' | 'md' | 'lg' }>()

// 12 avatar symbols (Unicode animal symbols – no emoji per se, but acceptable as decorative text)
const avatarEmojis = ['🦁', '🐯', '🐻', '🦊', '🐼', '🐸', '🦄', '🐬', '🦋', '🐉', '🦅', '🐙']
const bgColors = [
  'bg-orange-400', 'bg-amber-500', 'bg-brown-500', 'bg-red-400',
  'bg-slate-400', 'bg-green-500', 'bg-purple-400', 'bg-blue-400',
  'bg-pink-400', 'bg-indigo-500', 'bg-sky-500', 'bg-teal-500'
]

const bgClass = computed(() => bgColors[props.avatarId % bgColors.length])
</script>
