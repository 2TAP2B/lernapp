<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
    <!-- Header -->
    <header class="bg-white dark:bg-slate-800 shadow-sm px-4 py-3 flex items-center gap-3">
      <button
        class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        @click="router.push({ name: 'learn-select' })"
        aria-label="Zurück zur Auswahl"
      >
        <ChevronLeft class="w-5 h-5 text-slate-600 dark:text-slate-300" />
      </button>
      <div class="flex-1">
        <h1 class="font-extrabold text-slate-800 dark:text-white">Flaggen lernen</h1>
        <p class="text-xs text-slate-500">{{ seenInSession }} gesehen · {{ flagStore.learnedCount }} gelernt</p>
      </div>
      <!-- Progress bar -->
      <div class="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          class="h-full bg-indigo-500 rounded-full transition-all"
          :style="{ width: (seenInSession / 10) * 100 + '%' }"
        />
      </div>
      <button
        class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ml-1"
        @click="router.push({ name: 'home' })"
        aria-label="Zur Startseite"
      >
        <Home class="w-5 h-5 text-slate-600 dark:text-slate-300" />
      </button>
    </header>

    <!-- Loading state -->
    <div v-if="flagStore.loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p class="text-slate-500">Länder werden geladen...</p>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="flagStore.error" class="flex-1 flex items-center justify-center p-6">
      <div class="text-center bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl max-w-sm">
        <WifiOff class="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p class="font-bold text-slate-700 dark:text-white mb-2">Verbindungsproblem</p>
        <p class="text-slate-500 text-sm mb-4">{{ flagStore.error }}</p>
        <button class="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold" @click="flagStore.loadCountries()">
          Nochmal versuchen
        </button>
      </div>
    </div>

    <!-- Main card area -->
    <div
      v-else-if="currentCountry"
      class="flex-1 flex flex-col items-center justify-center p-4 gap-4"
    >
      <!-- XP Popup -->
      <XpPopup ref="xpPopupRef" />

      <!-- Card -->
      <FlagCard
        :country="currentCountry"
        :is-learned="!!flagStore.getProgress(currentCountry.id)?.learned"
        :drag-offset="dragOffset"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      />

      <!-- Navigation hints -->
      <div class="flex items-center gap-6 text-slate-400 text-xs">
        <span class="flex items-center gap-1"><ChevronUp class="w-4 h-4" /> Zurück</span>
        <span class="flex items-center gap-1"><ChevronDown class="w-4 h-4" /> Weiter</span>
      </div>

      <!-- Navigation buttons for desktop -->
      <div class="flex gap-4">
        <button
          class="px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-full shadow font-bold hover:shadow-md transition-all flex items-center gap-2"
          @click="prevCard"
          aria-label="Vorherige Flagge"
        >
          <ChevronLeft class="w-4 h-4" /> Zurück
        </button>
        <button
          class="px-6 py-3 bg-indigo-600 text-white rounded-full shadow font-bold transition-all flex items-center gap-2"
          :class="cardCooldown > 0 ? 'opacity-60 cursor-not-allowed' : 'hover:bg-indigo-700'"
          :disabled="cardCooldown > 0"
          @click="nextCard"
          aria-label="Nächste Flagge"
        >
          <span v-if="cardCooldown > 0">{{ cardCooldown }}s</span>
          <span v-else>Weiter</span>
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="flex-1 flex items-center justify-center p-6">
      <p class="text-slate-500">Keine Länder verfügbar.</p>
    </div>

    <!-- After 10 seen: CTA -->
    <Transition name="fade">
      <div
        v-if="seenInSession >= 10 && !ctaDismissed"
        class="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-indigo-600 to-indigo-500 text-white"
      >
        <div class="max-w-lg mx-auto flex items-center gap-4">
          <div class="flex-1">
            <p class="font-extrabold">10 Flaggen gesehen!</p>
            <p class="text-indigo-200 text-sm">Bereit für das Quiz?</p>
          </div>
          <button
            class="px-5 py-2.5 bg-white text-indigo-600 rounded-full font-extrabold shadow-xl hover:scale-105 transition-transform"
            @click="startQuiz"
          >
            Quiz starten!
          </button>
          <button class="text-indigo-200" @click="ctaDismissed = true" aria-label="Schließen">
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, WifiOff, X, Home } from '@lucide/vue'
import { useFlagStore } from '@/stores/flagStore'
import { useSwipe } from '@/composables/useSwipe'
import FlagCard from '@/components/flags/FlagCard.vue'
import XpPopup from '@/components/gamification/XpPopup.vue'

const flagStore = useFlagStore()
const router = useRouter()

const currentIndex = ref(0)
const seenInSession = ref(0)
const ctaDismissed = ref(false)
const xpPopupRef = ref<InstanceType<typeof XpPopup> | null>(null)
const cardCooldown = ref(10)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

function startCooldown() {
  cardCooldown.value = 10
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    if (cardCooldown.value > 0) cardCooldown.value--
    else clearInterval(cooldownTimer!)
  }, 1000)
}

// Order countries: unseen first (sorted by population desc), then seen (shuffled)
const sessionCountries = computed(() => {
  const seen = new Set(flagStore.progress.keys())
  const unseen = flagStore.countries
    .filter((c) => !seen.has(c.id))
    .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
  const seenArr = flagStore.countries.filter((c) => seen.has(c.id))
  // shuffle seen countries
  for (let i = seenArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[seenArr[i], seenArr[j]] = [seenArr[j]!, seenArr[i]!]
  }
  return [...unseen, ...seenArr]
})

const currentCountry = computed(() => sessionCountries.value[currentIndex.value])

async function nextCard() {
  if (cardCooldown.value > 0) return
  if (!currentCountry.value) return
  const { xpGained } = await flagStore.recordSeen(currentCountry.value.id)
  if (xpGained > 0) xpPopupRef.value?.show(xpGained)
  seenInSession.value++
  if (currentIndex.value < sessionCountries.value.length - 1) {
    currentIndex.value++
  } else {
    currentIndex.value = 0
  }
  startCooldown()
}

function prevCard() {
  if (currentIndex.value > 0) currentIndex.value--
  else currentIndex.value = sessionCountries.value.length - 1
}

const { dragOffset, handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipe(nextCard, prevCard)

function startQuiz() {
  router.push({ name: 'quiz' })
}

onMounted(() => {
  if (flagStore.countries.length === 0) {
    flagStore.loadCountries()
  }
  startCooldown()
})

onUnmounted(() => { if (cooldownTimer) clearInterval(cooldownTimer) })
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
