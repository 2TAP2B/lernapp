<template>
  <div
    ref="cardRef"
    class="flag-card w-full max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden select-none"
    :style="dragStyle"
    @touchstart="emit('touchstart', $event)"
    @touchmove="emit('touchmove', $event)"
    @touchend="emit('touchend', $event)"
  >
    <!-- Flag image -->
    <div class="relative bg-slate-100 dark:bg-slate-700 flex items-center justify-center" style="height: 220px;">
      <img
        v-if="country.flag_svg"
        :src="country.flag_svg"
        :alt="`Flagge von ${country.name_de}`"
        class="w-full h-full object-contain p-4"
        loading="lazy"
      />
      <div v-else class="text-slate-400 text-sm">Keine Flagge verfügbar</div>
      <!-- Learned badge -->
      <div
        v-if="isLearned"
        class="absolute top-3 right-3 bg-green-500 text-white rounded-full p-1.5 shadow"
        aria-label="Gelernt"
      >
        <CheckCircle class="w-5 h-5" />
      </div>
    </div>

    <!-- Country info -->
    <div class="p-6 space-y-3">
      <div class="text-center mb-4">
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-white">{{ country.name_de }}</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">{{ country.name_en }}</p>
      </div>

      <div class="grid grid-cols-2 gap-3 text-sm">
        <div v-if="country.capital" class="flex items-start gap-2">
          <MapPin class="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
          <div class="min-w-0">
            <p class="text-xs text-slate-400 leading-none">Hauptstadt</p>
            <p class="font-semibold text-slate-700 dark:text-slate-200 truncate">{{ country.capital }}</p>
          </div>
        </div>
        <div v-if="country.region" class="flex items-start gap-2">
          <Globe class="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
          <div class="min-w-0">
            <p class="text-xs text-slate-400 leading-none">Region</p>
            <p class="font-semibold text-slate-700 dark:text-slate-200 truncate">{{ country.region }}</p>
          </div>
        </div>
        <div v-if="country.population" class="flex items-start gap-2">
          <Users class="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
          <div class="min-w-0">
            <p class="text-xs text-slate-400 leading-none">Bevölkerung</p>
            <p class="font-semibold text-slate-700 dark:text-slate-200 truncate">{{ formatPopulation(country.population) }}</p>
          </div>
        </div>
        <div v-if="languages.length" class="flex items-start gap-2">
          <MessageSquare class="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
          <div class="min-w-0">
            <p class="text-xs text-slate-400 leading-none">Sprachen</p>
            <p class="font-semibold text-slate-700 dark:text-slate-200 truncate">{{ languages.slice(0, 2).join(', ') }}</p>
          </div>
        </div>
        <div v-if="currencies.length" class="flex items-start gap-2">
          <Coins class="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
          <div class="min-w-0">
            <p class="text-xs text-slate-400 leading-none">Währung</p>
            <p class="font-semibold text-slate-700 dark:text-slate-200 truncate">{{ currencies[0] }}</p>
          </div>
        </div>
        <div v-if="country.calling_code" class="flex items-start gap-2">
          <Phone class="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
          <div class="min-w-0">
            <p class="text-xs text-slate-400 leading-none">Vorwahl</p>
            <p class="font-semibold text-slate-700 dark:text-slate-200 truncate">{{ country.calling_code }}</p>
          </div>
        </div>
        <div v-if="country.area" class="flex items-start gap-2">
          <Map class="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
          <div class="min-w-0">
            <p class="text-xs text-slate-400 leading-none">Fläche</p>
            <p class="font-semibold text-slate-700 dark:text-slate-200 truncate">{{ formatArea(country.area) }}</p>
          </div>
        </div>
        <div v-if="country.subregion" class="flex items-start gap-2">
          <Compass class="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
          <div class="min-w-0">
            <p class="text-xs text-slate-400 leading-none">Subregion</p>
            <p class="font-semibold text-slate-700 dark:text-slate-200 truncate">{{ country.subregion }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { MapPin, Globe, Users, MessageSquare, Coins, Phone, Map, CheckCircle, Compass } from '@lucide/vue'
import type { Country } from '@/types'

const props = defineProps<{
  country: Country
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

const languages = computed<string[]>(() => {
  if (!props.country.languages) return []
  try { return JSON.parse(props.country.languages) } catch { return [] }
})

const currencies = computed<string[]>(() => {
  if (!props.country.currencies) return []
  try { return JSON.parse(props.country.currencies) } catch { return [] }
})

function formatPopulation(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' Mio.'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + ' Tsd.'
  return n.toString()
}

function formatArea(a: number): string {
  return a.toLocaleString('de-DE') + ' km²'
}
</script>
