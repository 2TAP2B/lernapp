import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Country, QuizModule, SortItem } from '@/types'
import { quizApi } from '@/services/api'
import { useUserStore } from './userStore'
import { useCatalogStore } from './catalogStore'

// ─── Quiz Module Registry ────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j] as T, a[i] as T]
  }
  return a
}

function pickDistractors(correct: string, pool: string[], count = 3): string[] {
  const others = pool.filter((x) => x !== correct)
  return shuffle(others).slice(0, count)
}

export const QUIZ_MODULES: QuizModule[] = [
  {
    id: 'flags',
    title: 'Flaggen-Quiz',
    description: 'Welcher Ländername passt zur Flagge?',
    icon: 'Flag',
    getQuestion: (c) => c.name_de,
    getChoices: (c, all) => {
      const correct = c.name_de
      const distractors = pickDistractors(correct, all.map((x) => x.name_de))
      return shuffle([correct, ...distractors])
    },
    getCorrectAnswer: (c) => c.name_de,
  },
  {
    id: 'capitals',
    title: 'Hauptstadt-Quiz',
    description: 'Welche Hauptstadt gehört zu diesem Land?',
    icon: 'Building2',
    getQuestion: (c) => c.name_de,
    getChoices: (c, all) => {
      const correct = c.capital ?? '—'
      const distractors = pickDistractors(
        correct,
        all.map((x) => x.capital ?? '—').filter((x) => x !== '—')
      )
      return shuffle([correct, ...distractors])
    },
    getCorrectAnswer: (c) => c.capital ?? '—',
  },
  {
    id: 'countries',
    title: 'Länder-Quiz',
    description: 'In welchem Land liegt diese Hauptstadt?',
    icon: 'MapPin',
    getQuestion: (c) => c.capital ?? c.name_de,
    getChoices: (c, all) => {
      const correct = c.name_de
      const distractors = pickDistractors(correct, all.map((x) => x.name_de))
      return shuffle([correct, ...distractors])
    },
    getCorrectAnswer: (c) => c.name_de,
  },
]

// ─── Quiz State ──────────────────────────────────────────────────────────────

export interface QuizQuestion {
  country?: Country | null
  questionText?: string        // for catalog choice quizzes
  choices: string[]
  correctAnswer: string
  // Sort question fields
  isSortQuestion?: boolean
  sortItems?: SortItem[]       // items to be arranged (shuffled)
  sortCorrectOrder?: string[]  // item IDs in correct order
}

export const useQuizStore = defineStore('quiz', () => {
  const sessionId = ref<string | null>(null)
  const activeModule = ref<QuizModule | null>(null)
  const activeCatalogId = ref<string | null>(null)
  const questions = ref<QuizQuestion[]>([])
  const currentIndex = ref(0)
  const answers = ref<(string | null)[]>([])
  const timePerQuestion = ref<number[]>([])
  const speedBonuses = ref(0)
  const streakCount = ref(0)
  const sessionStartTime = ref(0)
  const completed = ref(false)
  const loading = ref(false)

  const currentQuestion = computed(() => questions.value[currentIndex.value])
  const score = computed(() => answers.value.filter((a, i) => {
    const q = questions.value[i]
    if (!q) return false
    if (q.isSortQuestion) {
      // For sort: answer is JSON array of item IDs, compare with correctOrder
      try {
        const userOrder: string[] = JSON.parse(a ?? '[]')
        return JSON.stringify(userOrder) === JSON.stringify(q.sortCorrectOrder)
      } catch { return false }
    }
    return a === q.correctAnswer
  }).length)
  const totalQuestions = computed(() => questions.value.length)
  const isLastQuestion = computed(() => currentIndex.value === questions.value.length - 1)

  function getModule(id: string): QuizModule | undefined {
    return QUIZ_MODULES.find((m) => m.id === id)
  }

  async function startQuiz(moduleId: string, countryPool: Country[]) {
    const module = getModule(moduleId)
    if (!module) throw new Error('Unknown quiz module')

    const pool = shuffle(countryPool).slice(0, 10)
    const builtQuestions: QuizQuestion[] = pool.map((c) => ({
      country: c,
      choices: module.getChoices(c, countryPool),
      correctAnswer: module.getCorrectAnswer(c),
    }))

    const userStore = useUserStore()
    if (!userStore.currentUser) return

    loading.value = true
    try {
      const session = await quizApi.createSession(
        userStore.currentUser.id,
        moduleId,
        pool.map((c) => c.id)
      )
      sessionId.value = session.id
    } catch (e: unknown) {
      const err = e as { response?: { data?: { code?: string; error?: string } } }
      if (err?.response?.data?.code === 'NOT_ENOUGH_COUNTRIES') {
        throw new Error('NOT_ENOUGH_COUNTRIES')
      }
      throw e
    } finally {
      loading.value = false
    }

    activeModule.value = module
    activeCatalogId.value = null
    questions.value = builtQuestions
    currentIndex.value = 0
    answers.value = new Array(pool.length).fill(null)
    timePerQuestion.value = []
    speedBonuses.value = 0
    streakCount.value = 0
    sessionStartTime.value = Date.now()
    completed.value = false
  }

  // Start a catalog (custom question set) quiz — no backend session needed for XP here
  async function startCatalogQuiz(catalogId: string) {
    const catalogStore = useCatalogStore()
    if (!catalogStore.catalogs.length) await catalogStore.loadCatalogs()
    const catalog = catalogStore.getCatalog(catalogId)
    if (!catalog || catalog.questions.length === 0) throw new Error('Catalog not found or empty')

    const shuffled = [...catalog.questions].sort(() => Math.random() - 0.5)
    const pool = shuffled.slice(0, Math.min(10, shuffled.length))
    const builtQuestions: QuizQuestion[] = pool.map((q) => {
      if (q.type === 'sort') {
        const shuffledItems = [...q.items].sort(() => Math.random() - 0.5)
        return {
          country: null,
          questionText: q.question,
          choices: [],
          correctAnswer: '__sort__',
          isSortQuestion: true,
          sortItems: shuffledItems,
          sortCorrectOrder: q.correctOrder,
        }
      }
      // choice question
      const cq = q as import('@/types').ChoiceQuestion
      return {
        country: null,
        questionText: cq.question,
        choices: [...cq.choices].sort(() => Math.random() - 0.5),
        correctAnswer: cq.correct,
      }
    })

    const userStore = useUserStore()
    if (!userStore.currentUser) return

    // Create a backend session with quiz_type = 'catalog:{id}', empty pool
    loading.value = true
    try {
      const session = await quizApi.createSession(userStore.currentUser.id, `catalog:${catalogId}`, [])
      sessionId.value = session.id
    } catch {
      sessionId.value = null
    } finally {
      loading.value = false
    }

    activeModule.value = null
    activeCatalogId.value = catalogId
    questions.value = builtQuestions
    currentIndex.value = 0
    answers.value = new Array(pool.length).fill(null)
    timePerQuestion.value = []
    speedBonuses.value = 0
    streakCount.value = 0
    sessionStartTime.value = Date.now()
    completed.value = false
  }

  function answerQuestion(answer: string, timeLeft: number): boolean {
    const q = currentQuestion.value
    if (!q) return false
    answers.value[currentIndex.value] = answer
    const isCorrect = answer === q.correctAnswer
    const timeBonus = timeLeft > 10 // fast answer

    if (isCorrect) {
      streakCount.value++
      if (timeBonus) speedBonuses.value++
    } else {
      streakCount.value = 0
    }

    return isCorrect
  }

  /** Answer a sort question — orderedIds: item IDs in user's current order */
  function answerSortQuestion(orderedIds: string[]): boolean {
    const q = currentQuestion.value
    if (!q?.isSortQuestion) return false
    const answer = JSON.stringify(orderedIds)
    answers.value[currentIndex.value] = answer
    const isCorrect = JSON.stringify(orderedIds) === JSON.stringify(q.sortCorrectOrder)
    if (isCorrect) { streakCount.value++ } else { streakCount.value = 0 }
    return isCorrect
  }

  function nextQuestion() {
    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++
    }
  }

  async function completeQuiz(): Promise<{ xpGained: number }> {
    if (!sessionId.value) return { xpGained: 0 }
    const totalTime = Math.floor((Date.now() - sessionStartTime.value) / 1000)
    completed.value = true

    const userStore = useUserStore()
    try {
      const result = await quizApi.completeSession(
        sessionId.value,
        score.value,
        totalTime,
        speedBonuses.value
      )
      if (userStore.currentUser) {
        userStore.currentUser.xp += result.xp_gained
      }
      if (result.new_badges.length > 0) {
        userStore.pendingBadges.push(...result.new_badges)
        await userStore.loadBadges()
      }
      return { xpGained: result.xp_gained }
    } catch {
      return { xpGained: 0 }
    }
  }

  function reset() {
    sessionId.value = null
    activeModule.value = null
    activeCatalogId.value = null
    questions.value = []
    currentIndex.value = 0
    answers.value = []
    timePerQuestion.value = []
    speedBonuses.value = 0
    streakCount.value = 0
    completed.value = false
  }

  return {
    sessionId,
    activeModule,
    activeCatalogId,
    questions,
    currentIndex,
    answers,
    speedBonuses,
    streakCount,
    completed,
    loading,
    currentQuestion,
    score,
    totalQuestions,
    isLastQuestion,
    QUIZ_MODULES,
    getModule,
    startQuiz,
    startCatalogQuiz,
    answerQuestion,
    answerSortQuestion,
    nextQuestion,
    completeQuiz,
    reset,
  }
})
