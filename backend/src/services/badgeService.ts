import { db } from '../db/client'
import { user_badges, learn_progress, quiz_sessions, badge_definitions } from '../db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import type { ConditionType } from '../routes/badgeDefs'

export interface Badge {
  id: string
  title: string
  description: string
  icon: string
}

// ─── Default badge definitions (seeded on first run) ─────────────────────────

export const DEFAULT_BADGES: Array<{
  id: string; title: string; description: string; icon: string
  condition_type: ConditionType; condition_threshold: number
  condition_region?: string; sort_order: number
}> = [
  { id: 'first_learn',    title: 'Erste Schritte',  description: 'Erstes Land gelernt',           icon: 'Star',     condition_type: 'learnedCount',  condition_threshold: 1,   sort_order: 0 },
  { id: 'ten_learned',    title: 'Wissenshungrig',   description: '10 Länder gelernt',             icon: 'BookOpen', condition_type: 'learnedCount',  condition_threshold: 10,  sort_order: 1 },
  { id: 'first_quiz',     title: 'Quiz-Starter',     description: 'Erstes Quiz gespielt',          icon: 'Trophy',   condition_type: 'quizCount',     condition_threshold: 1,   sort_order: 2 },
  { id: 'perfect_quiz',   title: 'Perfektionist',    description: 'Quiz mit 100% bestanden',       icon: 'Award',    condition_type: 'perfectQuiz',   condition_threshold: 1,   sort_order: 3 },
  { id: 'europe_master',  title: 'Europa-Experte',   description: '20 europäische Länder gelernt', icon: 'Globe',    condition_type: 'regionLearned', condition_threshold: 20,  condition_region: 'Europe', sort_order: 4 },
  { id: 'world_traveler', title: 'Weltreisender',    description: '50 Länder gelernt',             icon: 'Plane',    condition_type: 'learnedCount',  condition_threshold: 50,  sort_order: 5 },
  { id: 'all_knowing',    title: 'Allwissend',       description: 'Alle Länder gelernt',           icon: 'Crown',    condition_type: 'learnedCount',  condition_threshold: 195, sort_order: 6 },
  { id: 'streak_7',       title: 'Fleißig',          description: '7 Tage Streak',                 icon: 'Flame',    condition_type: 'streak',        condition_threshold: 7,   sort_order: 7 },
]

export async function seedDefaultBadges(): Promise<void> {
  const existing = await db.select({ id: badge_definitions.id }).from(badge_definitions).limit(1)
  if (existing.length > 0) return
  for (const b of DEFAULT_BADGES) {
    await db.insert(badge_definitions).values({
      id: b.id, title: b.title, description: b.description, icon: b.icon,
      condition_type: b.condition_type, condition_threshold: b.condition_threshold,
      condition_region: b.condition_region ?? null, sort_order: b.sort_order,
    })
  }
  console.log('[badges] Seeded', DEFAULT_BADGES.length, 'default badge definitions')
}

// ─── Badge checker (rule-based, no eval) ─────────────────────────────────────

export async function checkAndAwardBadges(
  userId: string,
  sessionContext?: { streak_days?: number }
): Promise<Badge[]> {
  const [defs, earned] = await Promise.all([
    db.select().from(badge_definitions).orderBy(badge_definitions.sort_order),
    db.select({ badge_id: user_badges.badge_id }).from(user_badges).where(eq(user_badges.user_id, userId)),
  ])
  const earnedIds = new Set(earned.map((b) => b.badge_id))
  const newBadges: Badge[] = []
  const now = Date.now()

  let _learnedCount: number | null = null
  let _quizRows: typeof quiz_sessions.$inferSelect[] | null = null
  let _streakDays: number | null = null
  const regionCache = new Map<string, number>()

  async function getLearnedCount() {
    if (_learnedCount !== null) return _learnedCount
    const rows = await db.select().from(learn_progress)
      .where(and(eq(learn_progress.user_id, userId), eq(learn_progress.learned, true)))
    return (_learnedCount = rows.length)
  }
  async function getQuizRows() {
    if (_quizRows !== null) return _quizRows
    return (_quizRows = await db.select().from(quiz_sessions).where(eq(quiz_sessions.user_id, userId)))
  }
  async function getStreakDays() {
    if (_streakDays !== null) return _streakDays
    if (sessionContext?.streak_days !== undefined) return (_streakDays = sessionContext.streak_days)
    const r = await db.run(sql`SELECT streak_days FROM users WHERE id = ${userId}`)
    const row = r.rows[0] as Record<string, unknown> | undefined
    return (_streakDays = row ? Number(row['streak_days'] ?? 0) : 0)
  }
  async function getRegionCount(region: string) {
    if (regionCache.has(region)) return regionCache.get(region)!
    const r = await db.run(
      sql`SELECT COUNT(*) as cnt FROM learn_progress lp JOIN countries c ON lp.country_id = c.id
          WHERE lp.user_id = ${userId} AND lp.learned = 1 AND c.region = ${region}`
    )
    const row = r.rows[0] as Record<string, unknown> | undefined
    const cnt = row ? Number(row['cnt'] ?? 0) : 0
    regionCache.set(region, cnt)
    return cnt
  }

  for (const def of defs) {
    if (earnedIds.has(def.id)) continue
    let met = false
    const type = def.condition_type as ConditionType
    const threshold = def.condition_threshold
    if (type === 'learnedCount')  met = (await getLearnedCount()) >= threshold
    else if (type === 'quizCount') met = (await getQuizRows()).length >= threshold
    else if (type === 'perfectQuiz') {
      const rows = await getQuizRows()
      met = rows.filter((q) => q.completed_at && q.total_questions > 0 && q.score === q.total_questions).length >= threshold
    }
    else if (type === 'streak') met = (await getStreakDays()) >= threshold
    else if (type === 'regionLearned' && def.condition_region) met = (await getRegionCount(def.condition_region)) >= threshold

    if (met) {
      await db.insert(user_badges).values({ id: uuidv4(), user_id: userId, badge_id: def.id, earned_at: now })
      newBadges.push({ id: def.id, title: def.title, description: def.description, icon: def.icon })
      earnedIds.add(def.id)
    }
  }
  return newBadges
}

export async function getAllBadgeDefinitions(): Promise<Badge[]> {
  const rows = await db.select().from(badge_definitions).orderBy(badge_definitions.sort_order)
  return rows.map((r) => ({ id: r.id, title: r.title, description: r.description, icon: r.icon }))
}
