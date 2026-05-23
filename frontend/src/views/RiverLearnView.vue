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
        <h1 class="font-extrabold text-slate-800 dark:text-white">Flüsse lernen</h1>
        <p class="text-xs text-slate-500">{{ seenInSession }} gesehen · {{ riverStore.learnedCount }} gelernt</p>
      </div>
      <!-- Continent filter -->
      <select
        v-model="continentFilter"
        class="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full px-3 py-1.5 font-semibold border-none outline-none cursor-pointer"
        aria-label="Kontinent filtern"
      >
        <option value="">Alle</option>
        <option v-for="c in availableContinents" :key="c" :value="c">{{ c }}</option>
      </select>
    </header>

    <!-- Loading -->
    <div v-if="riverStore.loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p class="text-slate-500">Flüsse werden geladen...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="riverStore.error" class="flex-1 flex items-center justify-center p-6">
      <div class="text-center bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl max-w-sm">
        <WifiOff class="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p class="font-bold text-slate-700 dark:text-white mb-2">Verbindungsproblem</p>
        <p class="text-slate-500 text-sm mb-4">{{ riverStore.error }}</p>
        <button class="px-6 py-2 bg-blue-600 text-white rounded-full font-bold" @click="riverStore.loadRivers()">
          Nochmal versuchen
        </button>
      </div>
    </div>

    <!-- Main card area -->
    <div
      v-else-if="currentRiver"
      class="flex-1 flex flex-col items-center justify-center p-4 gap-4"
    >
      <!-- XP Popup -->
      <XpPopup ref="xpPopupRef" />

      <!-- Card -->
      <RiverCard
        :river="currentRiver"
        :is-learned="!!riverStore.getProgress(currentRiver.id)?.learned"
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

      <!-- Navigation buttons -->
      <div class="flex gap-4">
        <button
          class="px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-full shadow font-bold hover:shadow-md transition-all flex items-center gap-2"
          @click="prevCard"
          aria-label="Vorheriger Fluss"
        >
          <ChevronLeft class="w-4 h-4" /> Zurück
        </button>
        <button
          class="px-6 py-3 bg-blue-600 text-white rounded-full shadow font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
          @click="nextCard"
          aria-label="Nächster Fluss"
        >
          Weiter <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="flex-1 flex items-center justify-center p-6">
      <div class="text-center">
        <Droplets class="w-16 h-16 text-blue-300 mx-auto mb-4" />
        <p class="text-slate-500 font-semibold">Keine Flüsse gefunden.</p>
        <p v-if="continentFilter" class="text-sm text-slate-400 mt-1">
          Versuche einen anderen Kontinent.
        </p>
      </div>
    </div>

    <!-- After 5 seen: CTA to quiz -->
    <Transition name="fade">
      <div
        v-if="seenInSession >= 5 && !ctaDismissed"
        class="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-blue-600 to-blue-500 text-white"
      >
        <div class="max-w-lg mx-auto flex items-center gap-4">
          <Droplets class="w-8 h-8 shrink-0" />
          <div class="flex-1">
            <p class="font-extrabold">5 Flüsse gesehen!</p>
            <p class="text-blue-200 text-sm">Du kennst {{ riverStore.learnedCount }} Flüsse auswendig!</p>
          </div>
          <button class="text-blue-200" @click="ctaDismissed = true" aria-label="Schließen">
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, WifiOff, X, Droplets } from '@lucide/vue'
import { useRiverStore } from '@/stores/riverStore'
import { useSwipe } from '@/composables/useSwipe'
import RiverCard from '@/components/rivers/RiverCard.vue'
import XpPopup from '@/components/gamification/XpPopup.vue'

const riverStore = useRiverStore()
const router = useRouter()

const currentIndex = ref(0)
const seenInSession = ref(0)
const ctaDismissed = ref(false)
const continentFilter = ref('')
const xpPopupRef = ref<InstanceType<typeof XpPopup> | null>(null)

const availableContinents = computed(() => {
  const set = new Set(riverStore.rivers.map((r) => r.continent).filter(Boolean) as string[])
  return Array.from(set).sort()
})

// Filtered rivers, unseen first sorted by rank, then seen shuffled
const sessionRivers = computed(() => {
  const source = continentFilter.value
    ? riverStore.rivers.filter((r) => r.continent === continentFilter.value)
    : riverStore.rivers

  const seen = new Set(riverStore.progress.keys())
  const unseen = source.filter((r) => !seen.has(r.id)).sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
  const seenArr = source.filter((r) => seen.has(r.id))
  for (let i = seenArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[seenArr[i], seenArr[j]] = [seenArr[j]!, seenArr[i]!]
  }
  return [...unseen, ...seenArr]
})

const currentRiver = computed(() => sessionRivers.value[currentIndex.value])

async function nextCard() {
  if (!currentRiver.value) return
  const { xpGained } = await riverStore.recordSeen(currentRiver.value.id)
  if (xpGained > 0) xpPopupRef.value?.show(xpGained)
  seenInSession.value++
  if (currentIndex.value < sessionRivers.value.length - 1) {
    currentIndex.value++
  } else {
    currentIndex.value = 0
  }
}

function prevCard() {
  if (currentIndex.value > 0) currentIndex.value--
  else currentIndex.value = sessionRivers.value.length - 1
}

const { dragOffset, handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipe(nextCard, prevCard)

onMounted(async () => {
  if (riverStore.rivers.length === 0) await riverStore.loadRivers()
  await riverStore.loadProgress()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
