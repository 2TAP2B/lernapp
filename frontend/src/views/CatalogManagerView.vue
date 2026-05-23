<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
    <!-- Header -->
    <header class="bg-white dark:bg-slate-800 shadow-sm px-4 py-3 flex items-center gap-3">
      <button class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" @click="router.push({ name: 'home' })" aria-label="Zurück">
        <ChevronLeft class="w-5 h-5 text-slate-600 dark:text-slate-300" />
      </button>
      <h1 class="font-extrabold text-slate-800 dark:text-white flex-1">Quiz-Kataloge</h1>
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-full text-sm font-bold hover:bg-indigo-700 transition-all"
        @click="showCreateDialog = true"
      >
        <Plus class="w-4 h-4" /> Neu
      </button>
    </header>

    <!-- Import bar -->
    <div class="bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900 px-4 py-2 flex items-center gap-3">
      <Upload class="w-4 h-4 text-indigo-500 shrink-0" />
      <p class="text-sm text-indigo-700 dark:text-indigo-300 flex-1">Katalog importieren (JSON)</p>
      <label class="cursor-pointer px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-bold hover:bg-indigo-700">
        Datei wählen
        <input type="file" accept=".json" class="hidden" @change="handleImport" />
      </label>
    </div>

    <!-- Loading -->
    <div v-if="catalogStore.loading" class="flex-1 flex items-center justify-center">
      <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Empty state -->
    <div v-else-if="catalogStore.catalogs.length === 0" class="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
      <div class="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
        <HelpCircle class="w-8 h-8 text-indigo-400" />
      </div>
      <div>
        <p class="font-extrabold text-slate-700 dark:text-white text-lg">Noch keine Kataloge</p>
        <p class="text-slate-500 text-sm">Erstelle einen eigenen oder importiere eine JSON-Datei</p>
      </div>
      <button class="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700" @click="showCreateDialog = true">
        Ersten Katalog erstellen
      </button>
    </div>

    <!-- Catalog list -->
    <div v-else class="flex-1 p-4 space-y-3">
      <div
        v-for="cat in catalogStore.catalogs"
        :key="cat.id"
        class="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow flex items-center gap-4"
      >
        <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center shrink-0">
          <component :is="getIcon(cat.icon)" class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-extrabold text-slate-800 dark:text-white truncate">{{ cat.title }}</p>
          <p class="text-xs text-slate-500 truncate">{{ cat.description || '–' }}</p>
          <p class="text-xs text-indigo-600 font-semibold mt-0.5">{{ cat.questions.length }} Fragen</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <!-- Play -->
          <button
            class="p-2 rounded-full bg-green-100 dark:bg-green-900/30 hover:bg-green-200 text-green-700 dark:text-green-400 transition-all"
            :title="`Katalog-Quiz starten: ${cat.title}`"
            @click="playQuiz(cat.id)"
          >
            <Play class="w-4 h-4" />
          </button>
          <!-- Edit -->
          <button
            class="p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-all"
            :title="`${cat.title} bearbeiten`"
            @click="openEditor(cat)"
          >
            <Pencil class="w-4 h-4" />
          </button>
          <!-- Export -->
          <a
            :href="catalogStore.exportUrl(cat.id)"
            :download="`${cat.id}.catalog.json`"
            class="p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-all"
            :title="`${cat.title} exportieren`"
          >
            <Download class="w-4 h-4" />
          </a>
          <!-- Delete -->
          <button
            class="p-2 rounded-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-600 dark:text-red-400 transition-all"
            :title="`${cat.title} löschen`"
            @click="confirmDelete(cat)"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Create / Edit Dialog -->
    <Teleport to="body">
      <div v-if="showCreateDialog || editingCatalog" class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
          <h2 class="font-extrabold text-xl text-slate-800 dark:text-white">
            {{ editingCatalog ? 'Katalog bearbeiten' : 'Neuer Katalog' }}
          </h2>

          <div class="space-y-3">
            <input v-model="form.title" placeholder="Titel" class="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
            <input v-model="form.description" placeholder="Beschreibung (optional)" class="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
          </div>

          <!-- Questions -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <p class="font-bold text-slate-700 dark:text-white">Fragen ({{ form.questions.length }})</p>
              <div class="flex gap-2">
                <button class="text-xs px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700 font-bold hover:bg-indigo-200" @click="addQuestion('choice')">+ Auswahl</button>
                <button class="text-xs px-2 py-1 rounded-lg bg-violet-100 text-violet-700 font-bold hover:bg-violet-200" @click="addQuestion('sort')">+ Sortierung</button>
              </div>
            </div>
            <div class="space-y-4">
              <div
                v-for="(q, qi) in form.questions"
                :key="q.id"
                class="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 space-y-2"
              >
                <!-- Question header -->
                <div class="flex items-start gap-2">
                  <span
                    class="text-xs font-extrabold px-1.5 py-0.5 rounded shrink-0 mt-2"
                    :class="q.type === 'sort' ? 'bg-violet-100 text-violet-700' : 'bg-indigo-100 text-indigo-700'"
                  >{{ q.type === 'sort' ? 'SORT' : 'MC' }}</span>
                  <input v-model="q.question" :placeholder="q.type === 'sort' ? 'z.B. Sortiere Flüsse vom längsten zum kürzesten' : 'Frage'" class="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" />
                  <button class="p-1.5 text-red-400 hover:text-red-600 mt-0.5 shrink-0" @click="removeQuestion(qi)" aria-label="Frage entfernen">
                    <X class="w-4 h-4" />
                  </button>
                </div>

                <!-- Multiple-choice answers -->
                <template v-if="q.type !== 'sort'">
                  <div class="pl-14 grid grid-cols-2 gap-2">
                    <div v-for="(_, ci) in (q as ChoiceFormQuestion).choices" :key="ci" class="flex items-center gap-1.5">
                      <input
                        type="radio"
                        :name="`correct-${qi}`"
                        :value="ci"
                        :checked="(q as ChoiceFormQuestion).correctIndex === ci"
                        @change="(q as ChoiceFormQuestion).correctIndex = ci"
                        class="accent-indigo-600"
                        :title="`Antwort ${ci + 1} als korrekt markieren`"
                      />
                      <input
                        v-model="(q as ChoiceFormQuestion).choices[ci]"
                        :placeholder="`Antwort ${ci + 1}`"
                        class="flex-1 px-2 py-1 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                  <p class="pl-14 text-xs text-indigo-500">Radio = richtige Antwort</p>
                </template>

                <!-- Sort items -->
                <template v-else>
                  <div class="pl-14 space-y-1.5">
                    <p class="text-xs text-violet-600 font-semibold">Elemente in der richtigen Reihenfolge eintragen (oben = erstes):</p>
                    <div
                      v-for="(item, ii) in (q as SortFormQuestion).items"
                      :key="item.id"
                      class="flex items-center gap-2"
                    >
                      <span class="text-xs font-bold text-slate-400 w-4 shrink-0">{{ ii + 1 }}.</span>
                      <input
                        v-model="item.label"
                        :placeholder="`Element ${ii + 1}`"
                        class="flex-1 px-2 py-1 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs"
                      />
                      <button
                        v-if="(q as SortFormQuestion).items.length > 2"
                        class="p-1 text-red-400 hover:text-red-600"
                        @click="removeSortItem(q as SortFormQuestion, ii)"
                      >
                        <X class="w-3 h-3" />
                      </button>
                    </div>
                    <button class="text-xs text-violet-600 font-bold hover:underline mt-1" @click="addSortItem(q as SortFormQuestion)">
                      + Element hinzufügen
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <div class="flex gap-3 pt-2">
            <button class="flex-1 py-3 bg-slate-100 dark:bg-slate-700 rounded-2xl font-bold text-slate-600 dark:text-slate-300" @click="closeDialog">Abbrechen</button>
            <button
              class="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50"
              :disabled="!form.title || form.questions.length === 0"
              @click="saveDialog"
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
import { ChevronLeft, Plus, Upload, Download, Pencil, Trash2, Play, HelpCircle, X } from '@lucide/vue'
import { HelpCircle as HelpCircleIcon, Globe, MapPin, Flag, BookOpen, Star, Trophy } from '@lucide/vue'
import { useCatalogStore } from '@/stores/catalogStore'
import { useQuizStore } from '@/stores/quizStore'
import type { QuizCatalog, CustomQuestion, ChoiceQuestion, SortQuestion, SortItem } from '@/types'
import { v4 as uuid } from 'uuid'

const router = useRouter()
const catalogStore = useCatalogStore()
const quizStore = useQuizStore()

const showCreateDialog = ref(false)
const editingCatalog = ref<QuizCatalog | null>(null)

// ─── Form types ──────────────────────────────────────────────────────────────

interface ChoiceFormQuestion {
  id: string
  type: 'choice'
  question: string
  choices: [string, string, string, string]
  correctIndex: number
}

interface SortFormQuestion {
  id: string
  type: 'sort'
  question: string
  items: SortItem[]  // in correct order
}

type AnyFormQuestion = ChoiceFormQuestion | SortFormQuestion

interface CatalogForm {
  title: string
  description: string
  icon: string
  questions: AnyFormQuestion[]
}

function emptyForm(): CatalogForm {
  return { title: '', description: '', icon: 'HelpCircle', questions: [] }
}
const form = ref<CatalogForm>(emptyForm())

const iconMap: Record<string, unknown> = { HelpCircle: HelpCircleIcon, Globe, MapPin, Flag, BookOpen, Star, Trophy }
function getIcon(name: string) { return iconMap[name] ?? HelpCircleIcon }

function addQuestion(type: 'choice' | 'sort' = 'choice') {
  if (type === 'sort') {
    form.value.questions.push({
      id: uuid(),
      type: 'sort',
      question: '',
      items: [
        { id: uuid(), label: '' },
        { id: uuid(), label: '' },
        { id: uuid(), label: '' },
      ],
    } as SortFormQuestion)
  } else {
    form.value.questions.push({
      id: uuid(),
      type: 'choice',
      question: '',
      choices: ['', '', '', ''],
      correctIndex: -1,
    } as ChoiceFormQuestion)
  }
}

function addSortItem(q: SortFormQuestion) {
  q.items.push({ id: uuid(), label: '' })
}

function removeSortItem(q: SortFormQuestion, idx: number) {
  q.items.splice(idx, 1)
}

function removeQuestion(idx: number) {
  form.value.questions.splice(idx, 1)
}

function openEditor(cat: QuizCatalog) {
  editingCatalog.value = cat
  form.value = {
    title: cat.title,
    description: cat.description,
    icon: cat.icon,
    questions: cat.questions.map((q): AnyFormQuestion => {
      if (q.type === 'sort') {
        return {
          id: q.id,
          type: 'sort',
          question: q.question,
          items: q.correctOrder.map((itemId) => q.items.find((i) => i.id === itemId) ?? { id: itemId, label: '' }),
        } as SortFormQuestion
      }
      const cq = q as ChoiceQuestion
      const choices = (cq.choices.length >= 4 ? cq.choices.slice(0, 4) : [...cq.choices, '', '', '', ''].slice(0, 4)) as [string, string, string, string]
      return {
        id: cq.id,
        type: 'choice',
        question: cq.question,
        choices,
        correctIndex: choices.indexOf(cq.correct),
      } as ChoiceFormQuestion
    }),
  }
}

function closeDialog() {
  showCreateDialog.value = false
  editingCatalog.value = null
  form.value = emptyForm()
}

async function saveDialog() {
  const questions: CustomQuestion[] = form.value.questions
    .filter((q) => q.question.trim())
    .map((q): CustomQuestion | null => {
      if (q.type === 'sort') {
        const sq = q as SortFormQuestion
        const validItems = sq.items.filter((i) => i.label.trim())
        if (validItems.length < 2) return null
        return {
          id: sq.id || uuid(),
          type: 'sort',
          question: sq.question.trim(),
          items: validItems,
          correctOrder: validItems.map((i) => i.id),
        } as SortQuestion
      }
      const cq = q as ChoiceFormQuestion
      if (cq.correctIndex < 0 || !cq.choices[cq.correctIndex]) return null
      return {
        id: cq.id || uuid(),
        type: 'choice',
        question: cq.question.trim(),
        choices: cq.choices.filter(Boolean),
        correct: cq.choices[cq.correctIndex]!,
      } as ChoiceQuestion
    })
    .filter((q): q is CustomQuestion => q !== null)

  if (editingCatalog.value) {
    await catalogStore.updateCatalog(editingCatalog.value.id, {
      title: form.value.title,
      description: form.value.description,
      icon: form.value.icon,
      questions,
    })
  } else {
    await catalogStore.createCatalog(form.value.title, form.value.description, form.value.icon, questions)
  }
  closeDialog()
}

async function confirmDelete(cat: QuizCatalog) {
  if (confirm(`Katalog "${cat.title}" wirklich löschen?`)) {
    await catalogStore.removeCatalog(cat.id)
  }
}

async function handleImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const text = await file.text()
  try {
    await catalogStore.importFromJson(text)
  } catch {
    alert('Ungültiges Katalog-Format')
  }
}

async function playQuiz(catalogId: string) {
  await quizStore.startCatalogQuiz(catalogId)
  router.push({ name: 'quiz', query: { catalog: catalogId } })
}

onMounted(() => catalogStore.loadCatalogs())
</script>
