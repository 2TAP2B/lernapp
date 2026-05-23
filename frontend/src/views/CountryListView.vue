<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-slate-900 dark:to-slate-800">
    <!-- Header -->
    <header class="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700 px-4 py-3">
      <div class="flex items-center gap-3 mb-3">
        <button @click="router.back()" class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label="Zurück">
          <ChevronLeft class="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <h1 class="font-extrabold text-xl text-slate-800 dark:text-white flex-1">Entdecken</h1>
        <span class="text-sm text-slate-400 font-semibold">{{ filtered.length }} Einträge</span>
      </div>

      <!-- Category tabs -->
      <div class="flex gap-2 mb-3">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.key"
          @click="selectCategory(cat.key)"
          class="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all"
          :class="category === cat.key
            ? 'text-white shadow-md'
            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm'"
          :style="category === cat.key ? `background: ${cat.color}` : ''"
        >
          <component :is="cat.icon" class="w-4 h-4" />
          {{ cat.label }}
        </button>
      </div>

      <!-- Search -->
      <div class="relative mb-3">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="search"
          type="text"
          :placeholder="activeCat.searchPlaceholder"
          class="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <!-- Sort + Filter row -->
      <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          v-for="opt in activeCat.sortOptions"
          :key="opt.key"
          @click="toggleSort(opt.key)"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0"
          :class="sort === opt.key
            ? 'text-white shadow'
            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm'"
          :style="sort === opt.key ? `background: ${activeCat.color}` : ''"
        >
          <component :is="opt.icon" class="w-3.5 h-3.5" />
          {{ opt.label }}
          <span v-if="sort === opt.key">{{ sortDir === 'desc' ? '↓' : '↑' }}</span>
        </button>

        <div v-if="activeCat.filterOptions.length" class="w-px bg-slate-200 dark:bg-slate-600 shrink-0 mx-1" />

        <button
          v-for="f in activeCat.filterOptions"
          :key="f.key"
          @click="activeFilter = activeFilter === f.key ? null : f.key"
          class="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0"
          :class="activeFilter === f.key
            ? 'bg-violet-600 text-white shadow'
            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm'"
        >
          {{ f.label }}
        </button>
      </div>
    </header>

    <!-- List -->
    <div class="px-4 py-4 space-y-2">

      <!-- Countries -->
      <template v-if="category === 'countries'">
        <div
          v-for="(country, idx) in filtered as Country[]"
          :key="country.id"
          class="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-2xl shadow px-4 py-3"
        >
          <span class="w-7 text-center text-xs font-extrabold text-slate-400 shrink-0">#{{ idx + 1 }}</span>
          <img :src="country.flag_png ?? ''" :alt="country.name_de" class="w-10 h-7 object-cover rounded shadow-sm shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="font-extrabold text-slate-800 dark:text-white text-sm truncate">{{ country.name_de }}</p>
            <p class="text-xs text-slate-400 truncate">{{ country.capital ?? '–' }} · {{ country.subregion ?? country.region }}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">{{ formatCountryValue(country) }}</p>
            <p class="text-xs text-slate-400">{{ countryUnit }}</p>
          </div>
          <div v-if="flagStore.getProgress(country.id)?.learned" class="w-2 h-2 rounded-full bg-green-400 shrink-0" title="Gelernt" />
        </div>
      </template>

      <!-- Rivers -->
      <template v-else-if="category === 'rivers'">
        <div
          v-for="(river, idx) in filtered as River[]"
          :key="river.id"
          class="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-2xl shadow px-4 py-3"
        >
          <span class="w-7 text-center text-xs font-extrabold text-slate-400 shrink-0">#{{ river.rank ?? idx + 1 }}</span>
          <!-- Continent color dot -->
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-extrabold"
            :style="{ background: continentColor(river.continent) }"
          >
            <Droplets class="w-5 h-5 opacity-90" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-extrabold text-slate-800 dark:text-white text-sm truncate">{{ river.name_de }}</p>
            <p class="text-xs text-slate-400 truncate">{{ river.continent }} · {{ river.outflow }}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="font-extrabold text-blue-600 dark:text-blue-400 text-sm">{{ formatRiverValue(river) }}</p>
            <p class="text-xs text-slate-400">{{ riverUnit }}</p>
          </div>
          <div v-if="riverStore.getProgress(river.id)?.learned" class="w-2 h-2 rounded-full bg-green-400 shrink-0" title="Gelernt" />
        </div>
      </template>

      <p v-if="filtered.length === 0" class="text-center text-slate-400 py-12 text-sm">Keine Einträge gefunden.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, Search, Users, Maximize2, MapPin, Droplets, Ruler, Waves, Globe, ArrowUpDown } from '@lucide/vue'
import { useFlagStore } from '@/stores/flagStore'
import { useRiverStore } from '@/stores/riverStore'
import type { Country, River } from '@/types'

const router = useRouter()
const flagStore = useFlagStore()
const riverStore = useRiverStore()

// ─── Category definitions ─────────────────────────────────────────────────────
// To add a new category: push a new object into this array.

type CategoryKey = 'countries' | 'rivers'

interface SortOption { key: string; label: string; icon: unknown; defaultDir: 'asc' | 'desc' }
interface FilterOption { key: string; label: string }
interface CategoryDef {
  key: CategoryKey
  label: string
  icon: unknown
  color: string
  searchPlaceholder: string
  sortOptions: SortOption[]
  filterOptions: FilterOption[]
  defaultSort: string
}

const CATEGORIES: CategoryDef[] = [
  {
    key: 'countries',
    label: 'Länder',
    icon: Globe,
    color: '#4f46e5',
    searchPlaceholder: 'Land suchen…',
    defaultSort: 'population',
    sortOptions: [
      { key: 'population', label: 'Einwohner', icon: Users, defaultDir: 'desc' },
      { key: 'area',       label: 'Fläche',    icon: Maximize2, defaultDir: 'desc' },
      { key: 'name',       label: 'Name',      icon: MapPin, defaultDir: 'asc' },
    ],
    filterOptions: [
      { key: 'Europa',    label: '🌍 Europa' },
      { key: 'Asien',     label: '🌏 Asien' },
      { key: 'Afrika',    label: '🌍 Afrika' },
      { key: 'Amerika',   label: '🌎 Amerika' },
      { key: 'Ozeanien',  label: '🌊 Ozeanien' },
    ],
  },
  {
    key: 'rivers',
    label: 'Flüsse',
    icon: Droplets,
    color: '#2563eb',
    searchPlaceholder: 'Fluss suchen…',
    defaultSort: 'rank',
    sortOptions: [
      { key: 'rank',       label: 'Rang',    icon: ArrowUpDown, defaultDir: 'asc' },
      { key: 'length_km',  label: 'Länge',   icon: Ruler, defaultDir: 'desc' },
      { key: 'discharge',  label: 'Abfluss', icon: Waves, defaultDir: 'desc' },
      { key: 'name',       label: 'Name',    icon: MapPin, defaultDir: 'asc' },
    ],
    filterOptions: [
      { key: 'Afrika',       label: '🌍 Afrika' },
      { key: 'Asien',        label: '🌏 Asien' },
      { key: 'Europa',       label: '🌍 Europa' },
      { key: 'Nordamerika',  label: '🌎 Nordamerika' },
      { key: 'Südamerika',   label: '🌎 Südamerika' },
      { key: 'Australien',   label: '🌊 Australien' },
    ],
  },
]

// ─── State ────────────────────────────────────────────────────────────────────
const category = ref<CategoryKey>('countries')
const sort = ref<string>('population')
const sortDir = ref<'asc' | 'desc'>('desc')
const search = ref('')
const activeFilter = ref<string | null>(null)

const activeCat = computed(() => CATEGORIES.find((c) => c.key === category.value)!)

function selectCategory(key: CategoryKey) {
  category.value = key
  search.value = ''
  activeFilter.value = null
  const cat = CATEGORIES.find((c) => c.key === key)!
  sort.value = cat.defaultSort
  sortDir.value = cat.sortOptions.find((o) => o.key === cat.defaultSort)?.defaultDir ?? 'desc'
}

function toggleSort(key: string) {
  if (sort.value === key) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sort.value = key
    sortDir.value = activeCat.value.sortOptions.find((o) => o.key === key)?.defaultDir ?? 'desc'
  }
}

// ─── Filtered + sorted lists ──────────────────────────────────────────────────
const filtered = computed((): Country[] | River[] => {
  const q = search.value.trim().toLowerCase()

  if (category.value === 'countries') {
    let list = [...flagStore.countries]
    if (activeFilter.value)
      list = list.filter((c) => c.region === activeFilter.value)
    if (q)
      list = list.filter((c) =>
        c.name_de.toLowerCase().includes(q) ||
        c.name_en.toLowerCase().includes(q) ||
        (c.capital ?? '').toLowerCase().includes(q),
      )
    list.sort((a, b) => {
      let diff = 0
      if (sort.value === 'population') diff = (a.population ?? 0) - (b.population ?? 0)
      else if (sort.value === 'area')  diff = (a.area ?? 0) - (b.area ?? 0)
      else diff = a.name_de.localeCompare(b.name_de, 'de')
      return sortDir.value === 'desc' ? -diff : diff
    })
    return list
  }

  if (category.value === 'rivers') {
    let list = [...riverStore.rivers]
    if (activeFilter.value)
      list = list.filter((r) => r.continent === activeFilter.value)
    if (q)
      list = list.filter((r) =>
        r.name_de.toLowerCase().includes(q) ||
        r.name_en.toLowerCase().includes(q) ||
        (r.outflow ?? '').toLowerCase().includes(q),
      )
    list.sort((a, b) => {
      let diff = 0
      if (sort.value === 'rank')      diff = (a.rank ?? 999) - (b.rank ?? 999)
      else if (sort.value === 'length_km') diff = (a.length_km ?? 0) - (b.length_km ?? 0)
      else if (sort.value === 'discharge') diff = (a.discharge_m3s ?? 0) - (b.discharge_m3s ?? 0)
      else diff = a.name_de.localeCompare(b.name_de, 'de')
      return sortDir.value === 'desc' ? -diff : diff
    })
    return list
  }

  return []
})

// ─── Format helpers ───────────────────────────────────────────────────────────
const countryUnit = computed(() => {
  if (sort.value === 'population') return 'Einwohner'
  if (sort.value === 'area') return 'km²'
  return ''
})

const riverUnit = computed(() => {
  if (sort.value === 'length_km')  return 'km'
  if (sort.value === 'discharge')  return 'm³/s'
  if (sort.value === 'rank')       return 'km Länge'
  return ''
})

function formatCountryValue(c: Country): string {
  if (sort.value === 'population') {
    const n = c.population ?? 0
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' Mrd.'
    if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + ' Mio.'
    if (n >= 1_000)         return (n / 1_000).toFixed(0) + ' Tsd.'
    return n.toString()
  }
  if (sort.value === 'area') {
    const a = c.area ?? 0
    if (a >= 1_000_000) return (a / 1_000_000).toFixed(2) + ' Mio.'
    return a.toLocaleString('de-DE')
  }
  return ''
}

function formatRiverValue(r: River): string {
  if (sort.value === 'rank' || sort.value === 'length_km') {
    return (r.length_km ?? 0).toLocaleString('de-DE')
  }
  if (sort.value === 'discharge') {
    return (r.discharge_m3s ?? 0).toLocaleString('de-DE')
  }
  return (r.length_km ?? 0).toLocaleString('de-DE')
}

const CONTINENT_COLORS: Record<string, string> = {
  Afrika:      '#f59e0b',
  Asien:       '#10b981',
  Europa:      '#3b82f6',
  Nordamerika: '#0ea5e9',
  Südamerika:  '#22c55e',
  Australien:  '#ef4444',
}
function continentColor(c: string | null): string {
  return CONTINENT_COLORS[c ?? ''] ?? '#6366f1'
}

// ─── Load data ────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (riverStore.rivers.length === 0) await riverStore.loadRivers()
  if (riverStore.seenCount === 0)     await riverStore.loadProgress()
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
