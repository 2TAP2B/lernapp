import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const countries = sqliteTable('countries', {
  id: text('id').primaryKey(), // ISO alpha-2
  name_de: text('name_de').notNull(),
  name_en: text('name_en').notNull(),
  capital: text('capital'),
  region: text('region'),
  subregion: text('subregion'),
  population: integer('population'),
  languages: text('languages'), // JSON array string
  currencies: text('currencies'), // JSON array string
  flag_svg: text('flag_svg'),
  flag_png: text('flag_png'),
  calling_code: text('calling_code'),
  area: real('area'),
  updated_at: integer('updated_at'),
})

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  avatar_id: integer('avatar_id').notNull().default(0),
  xp: integer('xp').notNull().default(0),
  level: integer('level').notNull().default(1),
  streak_days: integer('streak_days').notNull().default(0),
  last_active: integer('last_active'),
  created_at: integer('created_at').notNull(),
})

export const learn_progress = sqliteTable('learn_progress', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id),
  country_id: text('country_id').notNull().references(() => countries.id),
  seen_count: integer('seen_count').notNull().default(0),
  last_seen: integer('last_seen'),
  learned: integer('learned', { mode: 'boolean' }).notNull().default(false),
})

export const quiz_sessions = sqliteTable('quiz_sessions', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id),
  quiz_type: text('quiz_type').notNull(),
  countries_pool: text('countries_pool').notNull(), // JSON array
  score: integer('score').notNull().default(0),
  total_questions: integer('total_questions').notNull().default(10),
  time_seconds: integer('time_seconds'),
  completed_at: integer('completed_at'),
})

export const user_badges = sqliteTable('user_badges', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id),
  badge_id: text('badge_id').notNull(),
  earned_at: integer('earned_at').notNull(),
})

// ─── Custom Quiz Catalogs ────────────────────────────────────────────────────

export const quiz_catalogs = sqliteTable('quiz_catalogs', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  icon: text('icon').notNull().default('HelpCircle'),
  questions: text('questions').notNull(), // JSON: CustomQuestion[]
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull(),
})

// ─── Badge Definitions ───────────────────────────────────────────────────────
// condition_type: 'learnedCount' | 'quizCount' | 'perfectQuiz' | 'streak' | 'regionLearned'
// condition_region: only used when condition_type = 'regionLearned'

export const badge_definitions = sqliteTable('badge_definitions', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull().default('Award'),
  condition_type: text('condition_type').notNull(),
  condition_threshold: integer('condition_threshold').notNull().default(1),
  condition_region: text('condition_region'),
  sort_order: integer('sort_order').notNull().default(0),
})

// ─── Rivers ──────────────────────────────────────────────────────────────────

export const rivers = sqliteTable('rivers', {
  id: text('id').primaryKey(),              // slug: 'nil', 'amazonas'
  name_de: text('name_de').notNull(),
  name_en: text('name_en').notNull(),
  rank: integer('rank'),                    // Rang nach Länge
  length_km: real('length_km'),            // Länge in km
  catchment_km2: real('catchment_km2'),    // Einzugsgebiet km²
  discharge_m3s: real('discharge_m3s'),    // Mittlerer Abfluss m³/s
  continent: text('continent'),            // Kontinent (auf Deutsch)
  countries: text('countries'),            // JSON: string[] Ländernamen
  outflow: text('outflow'),               // Mündung in (Meer/See/Fluss)
  source_region: text('source_region'),   // Quellgebiet
  updated_at: integer('updated_at'),
})

export const river_progress = sqliteTable('river_progress', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id),
  river_id: text('river_id').notNull().references(() => rivers.id),
  seen_count: integer('seen_count').notNull().default(0),
  last_seen: integer('last_seen'),
  learned: integer('learned', { mode: 'boolean' }).notNull().default(false),
})
