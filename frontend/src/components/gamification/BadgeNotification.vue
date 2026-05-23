<template>
  <Teleport to="body">
    <Transition name="badge-slide">
      <div
        v-if="currentBadge"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 min-w-72 border-2 border-yellow-400"
        role="alert"
        aria-live="assertive"
      >
        <div class="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
          <component :is="getIcon(currentBadge.icon)" class="w-7 h-7 text-yellow-500" />
        </div>
        <div>
          <p class="text-xs font-bold text-yellow-600 uppercase tracking-wide">Neues Badge!</p>
          <p class="font-extrabold text-slate-800 dark:text-white text-lg leading-tight">{{ currentBadge.title }}</p>
          <p class="text-xs text-slate-500">{{ currentBadge.description }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { gsap } from 'gsap'
import { Star, BookOpen, Trophy, Award, Globe, Plane, Crown, Flame, Zap } from '@lucide/vue'
import { useUserStore } from '@/stores/userStore'
import type { Badge } from '@/types'

const userStore = useUserStore()
const currentBadge = ref<Badge | null>(null)
let queue: Badge[] = []
let showing = false

const iconMap: Record<string, unknown> = { Star, BookOpen, Trophy, Award, Globe, Plane, Crown, Flame, Zap }
function getIcon(name: string) {
  return iconMap[name] ?? Star
}

function showNext() {
  if (queue.length === 0) { showing = false; return }
  showing = true
  currentBadge.value = queue.shift() ?? null
  setTimeout(() => {
    currentBadge.value = null
    setTimeout(showNext, 400)
  }, 3000)
}

watch(
  () => userStore.pendingBadges.length,
  () => {
    if (userStore.pendingBadges.length > 0) {
      queue.push(...userStore.pendingBadges)
      userStore.clearPendingBadges()
      if (!showing) showNext()
    }
  }
)
</script>

<style scoped>
.badge-slide-enter-active {
  animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.badge-slide-leave-active {
  animation: slideDown 0.3s ease-in;
}
@keyframes slideUp {
  from { transform: translate(-50%, 120%); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}
@keyframes slideDown {
  from { transform: translate(-50%, 0); opacity: 1; }
  to { transform: translate(-50%, 120%); opacity: 0; }
}
</style>
