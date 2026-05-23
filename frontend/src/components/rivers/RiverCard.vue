<template>
  <div
    ref="cardRef"
    class="river-card w-full max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden select-none"
    :style="dragStyle"
    @touchstart="emit('touchstart', $event)"
    @touchmove="emit('touchmove', $event)"
    @touchend="emit('touchend', $event)"
  >
    <!-- Visual header: gradient river scene -->
    <div class="relative overflow-hidden" style="height: 200px;">
      <!-- Animated gradient background per continent -->
      <div class="absolute inset-0" :class="gradientClass" />
      <!-- Wave SVG layers -->
      <svg class="absolute bottom-0 left-0 w-full" viewBox="0 0 400 80" preserveAspectRatio="none" style="height: 60px; opacity: 0.6;">
        <path d="M0,40 C50,20 100,60 150,40 C200,20 250,60 300,40 C350,20 400,60 400,40 L400,80 L0,80 Z" fill="white" class="dark:fill-slate-800 fill-white" />
      </svg>
      <svg class="absolute bottom-0 left-0 w-full" viewBox="0 0 400 80" preserveAspectRatio="none" style="height: 44px; opacity: 0.4;">
        <path d="M0,50 C60,30 120,65 180,45 C240,25 300,65 360,45 C380,38 400,50 400,50 L400,80 L0,80 Z" fill="white" class="dark:fill-slate-800 fill-white" />
      </svg>
      <!-- Rank badge -->
      <div class="absolute top-4 left-4 flex items-center gap-2">
        <div class="bg-white/25 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
          <Droplets class="w-4 h-4 text-white" />
          <span class="text-white font-extrabold text-sm">
            {{ river.rank ? `#${river.rank}` : '' }}
          </span>
        </div>
        <div class="bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">
          <span class="text-white text-xs font-semibold">{{ river.continent }}</span>
        </div>
      </div>
      <!-- Learned badge -->
      <div
        v-if="isLearned"
        class="absolute top-4 right-4 bg-green-500 text-white rounded-full p-1.5 shadow-lg"
        aria-label="Gelernt"
      >
        <CheckCircle class="w-5 h-5" />
      </div>
      <!-- River name on image -->
      <div class="absolute bottom-8 left-0 right-0 text-center px-4">
        <h2 class="text-2xl font-extrabold text-white drop-shadow-lg">{{ river.name_de }}</h2>
        <p class="text-white/80 text-sm font-medium">{{ river.name_en }}</p>
      </div>
    </div>

    <!-- River info grid -->
    <div class="p-5 space-y-4">
      <!-- Länge prominent -->
      <div class="flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 rounded-2xl py-3 gap-3">
        <Ruler class="w-5 h-5 text-blue-500 shrink-0" />
        <div class="text-center">
          <p class="text-2xl font-extrabold text-blue-700 dark:text-blue-300">
            {{ river.length_km ? river.length_km.toLocaleString('de-DE') + ' km' : '–' }}
          </p>
          <p class="text-xs text-blue-500 font-semibold">Länge</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 text-sm">
        <!-- Mündung -->
        <div v-if="river.outflow" class="flex items-start gap-2">
          <Waves class="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
          <div class="min-w-0">
            <p class="text-xs text-slate-400 leading-none">Mündung</p>
            <p class="font-semibold text-slate-700 dark:text-slate-200 text-xs leading-snug mt-0.5">{{ river.outflow }}</p>
          </div>
        </div>
        <!-- Einzugsgebiet -->
        <div v-if="river.catchment_km2" class="flex items-start gap-2">
          <Map class="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
          <div class="min-w-0">
            <p class="text-xs text-slate-400 leading-none">Einzugsgebiet</p>
            <p class="font-semibold text-slate-700 dark:text-slate-200 text-xs mt-0.5">{{ formatArea(river.catchment_km2) }}</p>
          </div>
        </div>
        <!-- Abfluss -->
        <div v-if="river.discharge_m3s" class="flex items-start gap-2">
          <Gauge class="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
          <div class="min-w-0">
            <p class="text-xs text-slate-400 leading-none">Mittl. Abfluss</p>
            <p class="font-semibold text-slate-700 dark:text-slate-200 text-xs mt-0.5">{{ river.discharge_m3s.toLocaleString('de-DE') }} m³/s</p>
          </div>
        </div>
        <!-- Quelle -->
        <div v-if="river.source_region" class="flex items-start gap-2">
          <Mountain class="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
          <div class="min-w-0">
            <p class="text-xs text-slate-400 leading-none">Quelle</p>
            <p class="font-semibold text-slate-700 dark:text-slate-200 text-xs leading-snug mt-0.5">{{ river.source_region }}</p>
          </div>
        </div>
        <!-- Länder -->
        <div v-if="countries.length" class="flex items-start gap-2 col-span-2">
          <Globe class="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
          <div class="min-w-0">
            <p class="text-xs text-slate-400 leading-none">Durchflossene Länder</p>
            <p class="font-semibold text-slate-700 dark:text-slate-200 text-xs mt-0.5">{{ countries.slice(0, 5).join(' · ') }}<span v-if="countries.length > 5"> +{{ countries.length - 5 }}</span></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Droplets, Waves, Map, Gauge, Mountain, Globe, CheckCircle, Ruler } from '@lucide/vue'
import type { River } from '@/types'

const props = defineProps<{
  river: River
  isLearned?: boolean
  dragOffset?: number
}>()

const emit = defineEmits<{
  touchstart: [e: TouchEvent]
  touchmove: [e: TouchEvent]
  touchend: [e: TouchEvent]
}>()

const cardRef = ref<HTMLElement | null>(null)

const dragStyle = computed(() => {
  if (!props.dragOffset) return {}
  const offset = props.dragOffset
  const opacity = Math.max(0.6, 1 - Math.abs(offset) / 300)
  return {
    transform: `translateY(${offset}px)`,
    opacity,
    transition: props.dragOffset === 0 ? 'all 0.3s ease' : 'none',
  }
})

const countries = computed<string[]>(() => {
  if (!props.river.countries) return []
  try { return JSON.parse(props.river.countries) } catch { return [] }
})

// Continent-based gradient
const gradientClass = computed(() => {
  const c = props.river.continent
  if (c === 'Afrika') return 'bg-gradient-to-br from-amber-500 to-orange-600'
  if (c === 'Asien') return 'bg-gradient-to-br from-emerald-500 to-teal-700'
  if (c === 'Europa') return 'bg-gradient-to-br from-blue-500 to-indigo-700'
  if (c === 'Nordamerika') return 'bg-gradient-to-br from-sky-500 to-cyan-700'
  if (c === 'Südamerika') return 'bg-gradient-to-br from-green-500 to-emerald-800'
  if (c === 'Australien') return 'bg-gradient-to-br from-red-400 to-amber-600'
  return 'bg-gradient-to-br from-blue-400 to-indigo-600'
})

function formatArea(a: number): string {
  if (a >= 1_000_000) return (a / 1_000_000).toFixed(2).replace('.', ',') + ' Mio. km²'
  return a.toLocaleString('de-DE') + ' km²'
}
</script>
