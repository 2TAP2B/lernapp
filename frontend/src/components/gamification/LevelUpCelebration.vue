<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-indigo-600/90 backdrop-blur-sm">
      <canvas ref="confettiCanvas" class="absolute inset-0 w-full h-full pointer-events-none" />
      <div class="relative text-center text-white px-8">
        <Crown class="w-20 h-20 mx-auto mb-4 text-yellow-300" aria-hidden="true" />
        <p class="text-lg font-bold text-indigo-200 uppercase tracking-widest">Glückwunsch!</p>
        <h2 class="text-5xl font-extrabold mb-2">Level {{ newLevel }}!</h2>
        <p class="text-xl text-indigo-200 mb-8">Du hast aufgestiegen!</p>
        <button
          class="px-8 py-3 bg-white text-indigo-600 rounded-full font-extrabold text-lg shadow-xl hover:scale-105 transition-transform"
          @click="dismiss"
          aria-label="Weiter"
        >
          Weiter!
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Crown } from '@lucide/vue'
import confetti from 'canvas-confetti'

const visible = ref(false)
const newLevel = ref(1)
const confettiCanvas = ref<HTMLCanvasElement | null>(null)

function show(level: number) {
  newLevel.value = level
  visible.value = true
  setTimeout(() => {
    if (!confettiCanvas.value) return
    const myConfetti = confetti.create(confettiCanvas.value, { resize: true })
    myConfetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: ['#818cf8', '#f59e0b', '#22c55e', '#ec4899'] })
  }, 100)
}

function dismiss() {
  visible.value = false
}

defineExpose({ show })
</script>
