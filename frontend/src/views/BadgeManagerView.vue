<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
    <!-- Header -->
    <header class="bg-white dark:bg-slate-800 shadow-sm px-4 py-3 flex items-center gap-3">
      <button class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" @click="router.push({ name: 'home' })" aria-label="Zurück">
        <ChevronLeft class="w-5 h-5 text-slate-600 dark:text-slate-300" />
      </button>
      <h1 class="font-extrabold text-slate-800 dark:text-white flex-1">Badge-Definitionen</h1>
      <div class="flex items-center gap-2">
        <!-- Import -->
        <label class="cursor-pointer p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600" title="Importieren">
          <Upload class="w-4 h-4" />
          <input type="file" accept=".json" class="hidden" @change="handleImport" />
        </label>
        <!-- Export -->
        <a :href="badgeDefsApi.exportUrl()" download="badges.json" class="p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600" title="Exportieren">
          <Download class="w-4 h-4" />
        </a>
        <!-- Add -->
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-full text-sm font-bold hover:bg-indigo-700"
          @click="openCreate"
        >
          <Plus class="w-4 h-4" /> Neu
        </button>
      </div>
    </header>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Badge list -->
    <div v-else class="flex-1 p-4 space-y-3">
      <div
        v-for="(def, i) in defs"
        :key="def.id"
        class="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow flex items-center gap-4"
      >
        <div class="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
          <component :is="getIcon(def.icon)" class="w-6 h-6" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-extrabold text-slate-800 dark:text-white">{{ def.title }}</p>
          <p class="text-xs text-slate-500">{{ def.description }}</p>
          <p class="text-xs text-indigo-600 font-semibold mt-0.5">
            {{ conditionLabel(def) }}
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button class="p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600" @click="openEdit(def, i)" title="Bearbeiten">
            <Pencil class="w-4 h-4" />
          </button>
          <button class="p-2 rounded-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-600" @click="remove(def)" title="Löschen">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div v-if="defs.length === 0" class="text-center py-12 text-slate-400">
        Keine Badge-Definitionen. Importiere eine JSON-Datei oder erstelle neue.
      </div>
    </div>

    <!-- Dialog -->
    <Teleport to="body">
      <div v-if="showDialog" class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4">
          <h2 class="font-extrabold text-xl text-slate-800 dark:text-white">
            {{ editingDef ? 'Badge bearbeiten' : 'Neuer Badge' }}
          </h2>
          <div class="space-y-3">
            <input v-model="form.id" :disabled="!!editingDef" placeholder="ID (z.B. my_badge)" class="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white disabled:opacity-50" />
            <input v-model="form.title" placeholder="Titel" class="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
            <input v-model="form.description" placeholder="Beschreibung" class="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
            <input v-model="form.icon" placeholder="Icon (z.B. Star, Trophy, Award)" class="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
            <select v-model="form.conditionType" class="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white">
              <option value="learnedCount">Länder gelernt (Anzahl)</option>
              <option value="quizCount">Quiz gespielt (Anzahl)</option>
              <option value="perfectQuiz">Perfekte Quizze (Anzahl)</option>
              <option value="streak">Streak-Tage (Anzahl)</option>
              <option value="regionLearned">Region gelernt (Anzahl + Region)</option>
            </select>
            <div class="flex gap-2">
              <input v-model.number="form.threshold" type="number" min="1" placeholder="Schwellenwert" class="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
              <input
                v-if="form.conditionType === 'regionLearned'"
                v-model="form.region"
                placeholder="Region (z.B. Europe)"
                class="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              />
            </div>
          </div>
          <div class="flex gap-3 pt-2">
            <button class="flex-1 py-3 bg-slate-100 dark:bg-slate-700 rounded-2xl font-bold text-slate-600" @click="showDialog = false">Abbrechen</button>
            <button
              class="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50"
              :disabled="!form.id || !form.title || !form.conditionType"
              @click="saveDef"
            >Speichern</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, Plus, Upload, Download, Pencil, Trash2, Star, Trophy, Award, BookOpen, Globe, Flame, Crown, Plane, Zap } from '@lucide/vue'
import { badgeDefsApi } from '@/services/api'
import type { BadgeDefinition, BadgeConditionType, BadgesExport } from '@/types'

const router = useRouter()
const defs = ref<BadgeDefinition[]>([])
const loading = ref(false)
const showDialog = ref(false)
const editingDef = ref<BadgeDefinition | null>(null)

interface DefForm {
  id: string; title: string; description: string; icon: string
  conditionType: BadgeConditionType; threshold: number; region: string
}
function emptyForm(): DefForm {
  return { id: '', title: '', description: '', icon: 'Award', conditionType: 'learnedCount', threshold: 1, region: '' }
}
const form = ref<DefForm>(emptyForm())

const iconMap: Record<string, unknown> = { Star, Trophy, Award, BookOpen, Globe, Flame, Crown, Plane, Zap }
function getIcon(name: string) { return iconMap[name] ?? Award }

function conditionLabel(def: BadgeDefinition): string {
  const t = def.condition.threshold
  const labels: Record<BadgeConditionType, string> = {
    learnedCount: `${t} Länder gelernt`,
    quizCount: `${t} Quiz gespielt`,
    perfectQuiz: `${t} perfekte Quiz`,
    streak: `${t} Tage Streak`,
    regionLearned: `${t} Länder in ${def.condition.region ?? '?'}`,
  }
  return labels[def.condition.type] ?? def.condition.type
}

async function loadDefs() {
  loading.value = true
  try { defs.value = await badgeDefsApi.getAll() } finally { loading.value = false }
}

function openCreate() {
  editingDef.value = null
  form.value = emptyForm()
  showDialog.value = true
}
function openEdit(def: BadgeDefinition, _i: number) {
  editingDef.value = def
  form.value = {
    id: def.id, title: def.title, description: def.description, icon: def.icon,
    conditionType: def.condition.type, threshold: def.condition.threshold, region: def.condition.region ?? '',
  }
  showDialog.value = true
}

async function saveDef() {
  const def: BadgeDefinition = {
    id: form.value.id, title: form.value.title, description: form.value.description, icon: form.value.icon,
    condition: { type: form.value.conditionType, threshold: form.value.threshold, ...(form.value.region ? { region: form.value.region } : {}) },
  }
  if (editingDef.value) {
    await badgeDefsApi.update(def.id, def)
  } else {
    await badgeDefsApi.create(def)
  }
  showDialog.value = false
  await loadDefs()
}

async function remove(def: BadgeDefinition) {
  if (!confirm(`Badge "${def.title}" wirklich löschen?`)) return
  await badgeDefsApi.remove(def.id)
  defs.value = defs.value.filter((d) => d.id !== def.id)
}

async function handleImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const payload = JSON.parse(await file.text()) as BadgesExport
    await badgeDefsApi.import(payload)
    await loadDefs()
  } catch {
    alert('Ungültiges Badge-Format')
  }
}

onMounted(loadDefs)
</script>
