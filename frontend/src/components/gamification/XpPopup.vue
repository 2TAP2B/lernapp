<template>
  <Teleport to="body">
    <Transition name="xp-pop">
      <div
        v-if="visible"
        class="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
      >
        <div ref="textRef" class="text-3xl font-extrabold text-yellow-500 drop-shadow-lg">
          +{{ displayXp }} XP
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { gsap } from 'gsap'

const visible = ref(false)
const displayXp = ref(0)
const textRef = ref<HTMLElement | null>(null)

function show(xp: number) {
  displayXp.value = 0
  visible.value = true
  gsap.to(displayXp, { value: xp, duration: 0.6, ease: 'power2.out', snap: { value: 1 } })
  gsap.to(textRef, { y: -40, opacity: 0, duration: 1.2, delay: 0.5, ease: 'power1.in', onComplete: () => {
    visible.value = false
    gsap.set(textRef, { y: 0, opacity: 1 })
  }})
}

defineExpose({ show })
</script>

<style scoped>
.xp-pop-enter-active { animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes popIn {
  from { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
  to { transform: translate(-50%, 0) scale(1); opacity: 1; }
}
</style>
