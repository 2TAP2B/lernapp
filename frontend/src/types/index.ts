export interface Country {
  id: string
  name_de: string
  name_en: string
  capital: string | null
  region: string | null
  subregion: string | null
  population: number | null
  languages: string | null  // JSON string array
  currencies: string | null  // JSON string array
  flag_svg: string | null
  flag_png: string | null
  calling_code: string | null
  area: number | null
  updated_at: number | null
}

export interface River {
  id: string
  name_de: string
  name_en: string
  rank: number | null
  length_km: number | null
  catchment_km2: number | null
  discharge_m3s: number | null
  continent: string | null
  countries: string | null   // JSON string array
  outflow: string | null
  source_region: string | null
  updated_at: number | null
}

export interface RiverProgress {
  id: string
  user_id: string
  river_id: string
  seen_count: number
  last_seen: number | null
  learned: boolean
}

export interface User {
  id: string
  name: string
  avatar_id: number
  xp: number
  level: number
  streak_days: number
  last_active: number | null
  created_at: number
}

export interface LearnProgress {
  id: string
  user_id: string
  country_id: string
  seen_count: number
  last_seen: number | null
  learned: boolean
}

export interface QuizSession {
  id: string
  user_id: string
  quiz_type: string
  countries_pool: string[]
  score: number
  total_questions: number
  time_seconds: number | null
  completed_at: number | null
}

export interface Badge {
  id: string
  title: string
  description: string
  icon: string
}

export interface QuizModule {
  id: string
  title: string
  description: string
  icon: string
  getQuestion: (c: Country) => string
  getChoices: (c: Country, all: Country[]) => string[]
  getCorrectAnswer: (c: Country) => string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: number
}

// ─── Custom Quiz Catalogs ────────────────────────────────────────────────────

export interface SortItem {
  id: string
  label: string
}

// Multiple-choice question (existing)
export interface ChoiceQuestion {
  id: string
  type?: 'choice'
  question: string
  choices: string[]
  correct: string
}

// Drag-to-sort question
export interface SortQuestion {
  id: string
  type: 'sort'
  question: string
  items: SortItem[]          // items to sort
  correctOrder: string[]     // item IDs in the correct order
}

export type CustomQuestion = ChoiceQuestion | SortQuestion

export interface QuizCatalog {
  id: string
  title: string
  description: string
  icon: string
  questions: CustomQuestion[]
  created_at: number
  updated_at: number
}

export interface CatalogExport {
  format: 'lernapp-catalog'
  version: 1
  id: string
  title: string
  description: string
  icon: string
  questions: CustomQuestion[]
}

// ─── Configurable Badge Definitions ─────────────────────────────────────────

export type BadgeConditionType = 'learnedCount' | 'quizCount' | 'perfectQuiz' | 'streak' | 'regionLearned'

export interface BadgeDefinition {
  id: string
  title: string
  description: string
  icon: string
  condition: {
    type: BadgeConditionType
    threshold: number
    region?: string
  }
}

export interface BadgesExport {
  format: 'lernapp-badges'
  version: 1
  badges: BadgeDefinition[]
}

export type QuizType = 'flags' | 'capitals' | 'countries'
