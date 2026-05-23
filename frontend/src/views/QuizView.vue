<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
    <!-- Header -->
    <header class="bg-white dark:bg-slate-800 shadow-sm px-4 py-3 flex items-center gap-3">
      <button
        class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        @click="handleBack"
        aria-label="Zurück"
      >
        <ChevronLeft class="w-5 h-5 text-slate-600 dark:text-slate-300" />
      </button>
      <h1 class="font-extrabold text-slate-800 dark:text-white flex-1">Quiz</h1>
      <div v-if="phase === 'question'" class="text-sm font-bold text-slate-500">
        {{ quizStore.currentIndex + 1 }} / {{ quizStore.totalQuestions }}
      </div>
    </header>

    <!-- Phase: Module selection -->
    <div v-if="phase === 'select'" class="flex-1 flex flex-col items-center justify-center p-6 gap-4">
      <div class="text-center mb-4">
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-white mb-1">Welcher Quiz-Typ?</h2>
        <p class="text-slate-500">Wähle, was du testen möchtest</p>
      </div>

      <div v-if="flagStore.seenCount < 10" class="w-full max-w-md bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
        <AlertCircle class="w-6 h-6 text-amber-500 shrink-0" />
        <p class="text-amber-700 text-sm font-semibold">
          Du musst erst mindestens 10 Flaggen im Lern-Modus sehen!
          ({{ flagStore.seenCount }}/10)
        </p>
      </div>

      <div class="w-full max-w-md space-y-3">
        <button
          v-for="mod in QUIZ_MODULES"
          :key="mod.id"
          class="w-full flex items-center gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.01] transition-all border-2 border-transparent"
          :class="selectedModule === mod.id ? 'border-indigo-500' : ''"
          :disabled="flagStore.seenCount < 10"
          @click="selectedModule = mod.id"
          :aria-pressed="selectedModule === mod.id"
        >
          <div class="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
            <component :is="getIcon(mod.icon)" class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div class="text-left">
            <p class="font-extrabold text-slate-800 dark:text-white">{{ mod.title }}</p>
            <p class="text-sm text-slate-500">{{ mod.description }}</p>
          </div>
          <div v-if="selectedModule === mod.id" class="ml-auto">
            <CheckCircle2 class="w-6 h-6 text-indigo-600" />
          </div>
        </button>
      </div>

      <!-- Custom catalogs -->
      <div v-if="catalogStore.catalogs.length > 0" class="w-full max-w-md">
        <div class="flex items-center gap-2 mb-2">
          <div class="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          <span class="text-xs text-slate-400 font-semibold px-2">Eigene Kataloge</span>
          <div class="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        </div>
        <div class="space-y-2">
          <button
            v-for="cat in catalogStore.catalogs"
            :key="cat.id"
            class="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.01] transition-all border-2 border-transparent"
            :class="selectedModule === `catalog:${cat.id}` ? 'border-violet-500' : ''"
            @click="selectedModule = `catalog:${cat.id}`"
            :aria-pressed="selectedModule === `catalog:${cat.id}`"
          >
            <div class="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
              <component :is="getIcon(cat.icon)" class="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div class="text-left flex-1 min-w-0">
              <p class="font-extrabold text-slate-800 dark:text-white truncate">{{ cat.title }}</p>
              <p class="text-xs text-slate-500">{{ cat.questions.length }} Fragen</p>
            </div>
            <div v-if="selectedModule === `catalog:${cat.id}`" class="ml-auto">
              <CheckCircle2 class="w-5 h-5 text-violet-600" />
            </div>
          </button>
        </div>
      </div>

      <button
        class="w-full max-w-md py-4 bg-indigo-600 text-white rounded-full font-extrabold text-lg shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        :disabled="!selectedModule || flagStore.seenCount < 10 || quizStore.loading"
        @click="startQuiz"
      >
        <span v-if="quizStore.loading">Lade Quiz...</span>
        <span v-else>Quiz starten!</span>
      </button>
    </div>

    <!-- Phase: Question -->
    <div v-else-if="phase === 'question' && quizStore.currentQuestion" class="flex-1 flex flex-col p-4 gap-4">
      <!-- Progress bar -->
      <div class="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          class="h-full bg-indigo-500 rounded-full transition-all duration-300"
          :style="{ width: ((quizStore.currentIndex) / quizStore.totalQuestions) * 100 + '%' }"
        />
      </div>

      <!-- Timer -->
      <div class="flex items-center justify-between text-sm font-bold">
        <span class="text-slate-500">Frage {{ quizStore.currentIndex + 1 }}</span>
        <div
          class="flex items-center gap-1.5 px-3 py-1 rounded-full"
          :class="timeLeft <= 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'"
        >
          <Timer class="w-4 h-4" />
          <span>{{ timeLeft }}s</span>
        </div>
        <span class="text-indigo-600 font-extrabold">
          🔥 {{ quizStore.streakCount }}x Streak
        </span>
      </div>

      <!-- Question -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 text-center">
        <!-- Catalog sort quiz: show sort instruction -->
        <div v-if="quizStore.currentQuestion.isSortQuestion" class="py-4">
          <p class="text-violet-500 text-sm font-semibold mb-2">In die richtige Reihenfolge bringen</p>
          <h2 class="text-xl font-extrabold text-slate-800 dark:text-white leading-snug">
            {{ quizStore.currentQuestion.questionText }}
          </h2>
        </div>
        <!-- Catalog choice quiz: show question text -->
        <div v-else-if="quizStore.activeCatalogId" class="py-4">
          <p class="text-slate-500 text-sm mb-2">Welche Antwort ist richtig?</p>
          <h2 class="text-2xl font-extrabold text-slate-800 dark:text-white leading-snug">
            {{ quizStore.currentQuestion.questionText }}
          </h2>
        </div>
        <!-- Flags quiz: show flag image -->
        <div v-else-if="quizStore.activeModule?.id === 'flags'" class="mb-4">
          <img
            v-if="quizStore.currentQuestion.country?.flag_svg"
            :src="quizStore.currentQuestion.country.flag_svg"
            alt="Flagge"
            class="h-36 mx-auto object-contain"
          />
          <p class="text-slate-500 mt-2 font-semibold">Welches Land hat diese Flagge?</p>
        </div>
        <!-- Other country quizzes: show text question -->
        <div v-else class="py-4">
          <p class="text-slate-500 text-sm mb-2">{{ quizStore.activeModule?.description }}</p>
          <h2 class="text-3xl font-extrabold text-slate-800 dark:text-white">
            {{ quizStore.activeModule?.getQuestion(quizStore.currentQuestion.country!) }}
          </h2>
        </div>
      </div>

      <!-- Sort drag list -->
      <div v-if="quizStore.currentQuestion.isSortQuestion" class="flex flex-col gap-3">
        <SortDragList
          ref="sortDragRef"
          :items="quizStore.currentQuestion.sortItems!"
          :correctOrder="answered ? quizStore.currentQuestion.sortCorrectOrder : undefined"
          :answered="answered"
          @update="(order) => (pendingSortOrder = order)"
        />
        <button
          v-if="!answered"
          class="w-full py-4 bg-violet-600 text-white rounded-2xl font-extrabold text-lg shadow hover:bg-violet-700 transition-all"
          @click="submitSort"
        >
          Fertig
        </button>
      </div>

      <!-- Answer choices (choice questions) -->
      <div v-else class="grid grid-cols-2 gap-3 flex-1">
        <button
          v-for="choice in quizStore.currentQuestion.choices"
          :key="choice"
          ref="choiceButtons"
          class="p-4 rounded-2xl font-bold text-sm min-h-[64px] transition-all shadow border-2"
          :class="getChoiceClass(choice)"
          :disabled="answered"
          @click="answer(choice)"
          :aria-label="`Antwort: ${choice}`"
        >
          {{ choice }}
        </button>
      </div>

    </div>

    <!-- Feedback overlay: fixed bottom sheet, click anywhere to continue -->
    <Teleport to="body">
      <Transition name="slide-up">
        <div
          v-if="phase === 'question' && answered"
          class="fixed inset-0 z-40 flex flex-col justify-end cursor-pointer"
          @click="nextQuestion"
          role="button"
          :aria-label="quizStore.isLastQuestion ? 'Ergebnis anzeigen' : 'Nächste Frage'"
        >
          <div class="absolute inset-0 bg-black/20" />
          <div
            class="relative z-10 rounded-t-3xl px-6 pt-5 pb-10 flex flex-col items-center gap-3 shadow-2xl"
            :class="lastAnswerCorrect ? 'bg-green-500 dark:bg-green-600' : 'bg-red-500 dark:bg-red-600'"
          >
            <div class="w-10 h-1 rounded-full bg-white/40 mb-1" />
            <div class="flex items-center gap-3 text-white">
              <component :is="lastAnswerCorrect ? CheckCircle2 : XCircle" class="w-8 h-8 shrink-0" />
              <div>
                <p class="font-extrabold text-xl leading-tight">
                  {{ lastAnswerCorrect ? 'Richtig!' : 'Falsch!' }}
                </p>
                <p v-if="!lastAnswerCorrect && !quizStore.currentQuestion?.isSortQuestion" class="text-white/90 text-sm font-semibold mt-0.5">
                  Richtige Antwort: {{ quizStore.currentQuestion?.correctAnswer }}
                </p>
                <p v-if="quizStore.currentQuestion?.isSortQuestion" class="text-white/90 text-sm font-semibold mt-0.5">
                  Sieh dir die Reihenfolge oben an
                </p>
              </div>
            </div>
            <p class="text-white/70 text-xs mt-1">Tippe irgendwo für die nächste Frage</p>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Phase: Results -->
    <div v-if="phase === 'result'" class="flex-1 flex flex-col items-center justify-center p-6 text-center gap-6">
      <LevelUpCelebration ref="levelUpRef" />

      <div class="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mx-auto">
        <Trophy class="w-12 h-12 text-indigo-600" />
      </div>

      <div>
        <h2 class="text-3xl font-extrabold text-slate-800 dark:text-white mb-1">Quiz abgeschlossen!</h2>
        <p class="text-slate-500">{{ quizStore.score }} von {{ quizStore.totalQuestions }} richtig</p>
      </div>

      <!-- Score circles -->
      <div class="grid grid-cols-3 gap-4 w-full max-w-sm">
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow text-center">
          <p class="text-3xl font-extrabold text-indigo-600">{{ quizStore.score }}/{{ quizStore.totalQuestions }}</p>
          <p class="text-xs text-slate-500 mt-1">Richtig</p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow text-center">
          <p class="text-3xl font-extrabold text-yellow-500">+{{ xpGained }}</p>
          <p class="text-xs text-slate-500 mt-1">XP</p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow text-center">
          <p class="text-3xl font-extrabold text-orange-500">{{ quizStore.speedBonuses }}</p>
          <p class="text-xs text-slate-500 mt-1">Speed-Bonus</p>
        </div>
      </div>

      <div class="flex gap-4 w-full max-w-sm">
        <button
          class="flex-1 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-full font-extrabold shadow hover:shadow-md transition-all"
          @click="playAgain"
        >
          Nochmal
        </button>
        <button
          class="flex-1 py-4 bg-indigo-600 text-white rounded-full font-extrabold shadow-xl hover:bg-indigo-700 transition-all"
          @click="router.push({ name: 'home' })"
        >
          Startseite
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft, Trophy, Timer, CheckCircle2, XCircle, AlertCircle, Flag, Building2, MapPin, HelpCircle, BookOpen } from '@lucide/vue'
import { useQuizStore, QUIZ_MODULES } from '@/stores/quizStore'
import { useFlagStore } from '@/stores/flagStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { gsap } from 'gsap'
import LevelUpCelebration from '@/components/gamification/LevelUpCelebration.vue'
import SortDragList from '@/components/quiz/SortDragList.vue'

const quizStore = useQuizStore()
const flagStore = useFlagStore()
const catalogStore = useCatalogStore()
const router = useRouter()
const route = useRoute()

type Phase = 'select' | 'question' | 'result'
const phase = ref<Phase>('select')
const selectedModule = ref<string | null>(null)
const answered = ref(false)
const lastAnswer = ref<string | null>(null)
const lastAnswerCorrect = ref(false)
const xpGained = ref(0)
const timeLeft = ref(15)
const levelUpRef = ref<InstanceType<typeof LevelUpCelebration> | null>(null)
const sortDragRef = ref<InstanceType<typeof SortDragList> | null>(null)
const pendingSortOrder = ref<string[]>([])

let timer: ReturnType<typeof setInterval> | null = null

const iconMap: Record<string, unknown> = { Flag, Building2, MapPin, HelpCircle, BookOpen }
function getIcon(name: string) { return iconMap[name] ?? Flag }

function getChoiceClass(choice: string): string {
  if (!answered.value) {
    return 'bg-white dark:bg-slate-800 text-slate-700 dark:text-white border-slate-200 dark:border-slate-600 hover:border-indigo-400 hover:scale-[1.02]'
  }
  const isCorrect = choice === quizStore.currentQuestion?.correctAnswer
  if (isCorrect) return 'bg-green-500 border-green-500 text-white scale-[1.02]'
  if (choice === lastAnswer.value && !isCorrect) return 'bg-red-400 border-red-400 text-white'
  return 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 opacity-60'
}

function startTimer() {
  timeLeft.value = 15
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      clearInterval(timer!)
      if (quizStore.currentQuestion?.isSortQuestion) {
        submitSort() // submit whatever order they have
      } else {
        answer('') // auto-answer wrong for choice questions
      }
    }
  }, 1000)
}

function answer(choice: string) {
  if (answered.value) return
  if (timer) clearInterval(timer)
  lastAnswer.value = choice
  const isCorrect = quizStore.answerQuestion(choice, timeLeft.value)
  lastAnswerCorrect.value = isCorrect
  answered.value = true
}

function submitSort() {
  if (answered.value) return
  if (timer) clearInterval(timer)
  // Use current order from the drag list (or fallback to the shuffled order)
  const order = pendingSortOrder.value.length > 0
    ? pendingSortOrder.value
    : (quizStore.currentQuestion?.sortItems?.map((i) => i.id) ?? [])
  const isCorrect = quizStore.answerSortQuestion(order)
  lastAnswerCorrect.value = isCorrect
  answered.value = true
}

function nextQuestion() {
  if (quizStore.isLastQuestion) {
    finishQuiz()
    return
  }
  answered.value = false
  lastAnswer.value = null
  pendingSortOrder.value = []
  quizStore.nextQuestion()
  startTimer()
}

async function finishQuiz() {
  if (timer) clearInterval(timer)
  const result = await quizStore.completeQuiz()
  xpGained.value = result.xpGained
  phase.value = 'result'

  // Check level up
  const userStore = (await import('@/stores/userStore')).useUserStore()
  if (userStore.currentUser && quizStore.score > 0) {
    const prevLevel = userStore.currentUser.level
    userStore.currentUser.xp += result.xpGained
    const newLevel = calcLevel(userStore.currentUser.xp)
    if (newLevel > prevLevel) {
      setTimeout(() => levelUpRef.value?.show(newLevel), 500)
    }
  }
}

async function startQuiz() {
  if (!selectedModule.value) return
  try {
    if (selectedModule.value.startsWith('catalog:')) {
      const catalogId = selectedModule.value.slice('catalog:'.length)
      await quizStore.startCatalogQuiz(catalogId)
    } else {
      await quizStore.startQuiz(selectedModule.value, flagStore.seenCountries)
    }
    phase.value = 'question'
    answered.value = false
    startTimer()
  } catch (e: unknown) {
    const err = e as Error
    if (err.message === 'NOT_ENOUGH_COUNTRIES') {
      alert('Du musst erst mehr Länder im Lern-Modus ansehen!')
    }
  }
}

function playAgain() {
  quizStore.reset()
  phase.value = 'select'
  answered.value = false
  xpGained.value = 0
}

function handleBack() {
  if (phase.value === 'question') {
    if (!confirm('Quiz abbrechen?')) return
    quizStore.reset()
  }
  router.push({ name: 'home' })
}

function calcLevel(xp: number): number {
  const thresholds = [0, 100, 250, 500, 1000]
  let level = 1
  for (let i = 0; i < thresholds.length; i++) {
    const t = thresholds[i]
    if (t !== undefined && xp >= t) level = i + 1
  }
  if (xp >= 1000) level = 5 + Math.floor((xp - 1000) / 500)
  return level
}

onMounted(() => {
  catalogStore.loadCatalogs()
  // Support direct catalog launch from CatalogManagerView
  const catParam = route.query.catalog as string | undefined
  if (catParam && quizStore.activeCatalogId === catParam) {
    phase.value = 'question'
    startTimer()
  }
})

onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active { transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s; }
.slide-up-leave-active { transition: transform 0.2s ease-in, opacity 0.2s; }
.slide-up-enter-from { transform: translateY(100%); opacity: 0; }
.slide-up-leave-to { transform: translateY(100%); opacity: 0; }
</style>
