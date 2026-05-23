import { Hono } from 'hono'
import { db } from '../db/client'
import { quiz_sessions, learn_progress, users } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { checkAndAwardBadges } from '../services/badgeService'

const app = new Hono()

// POST /api/quiz/session  — create a new quiz session
app.post('/session', async (c) => {
  const body = await c.req.json<{
    user_id: string
    quiz_type: string
    countries_pool: string[]
  }>()

  if (!body.user_id || !body.quiz_type || !Array.isArray(body.countries_pool)) {
    return c.json({ error: 'Invalid request' }, 400)
  }

  // Validate user has seen enough countries
  const seenCount = await db
    .select()
    .from(learn_progress)
    .where(and(eq(learn_progress.user_id, body.user_id)))
  if (seenCount.length < 10) {
    return c.json({ error: 'Lerne erst 10 Flaggen!', code: 'NOT_ENOUGH_COUNTRIES' }, 422)
  }

  const id = uuidv4()
  const pool = body.countries_pool.slice(0, 10)

  await db.insert(quiz_sessions).values({
    id,
    user_id: body.user_id,
    quiz_type: body.quiz_type,
    countries_pool: JSON.stringify(pool),
    score: 0,
    total_questions: pool.length,
    completed_at: null,
  })

  return c.json({ id, quiz_type: body.quiz_type, countries_pool: pool })
})

// POST /api/quiz/session/:id/complete
app.post('/session/:id/complete', async (c) => {
  const sessionId = c.req.param('id')
  const body = await c.req.json<{
    score: number
    time_seconds: number
    speed_bonuses?: number
  }>()

  const session = await db
    .select()
    .from(quiz_sessions)
    .where(eq(quiz_sessions.id, sessionId))
    .get()

  if (!session) return c.json({ error: 'Session not found' }, 404)
  if (session.completed_at) return c.json({ error: 'Session already completed' }, 400)

  const now = Date.now()

  await db
    .update(quiz_sessions)
    .set({ score: body.score, time_seconds: body.time_seconds, completed_at: now })
    .where(eq(quiz_sessions.id, sessionId))

  // Calculate XP
  let xpGained = body.score * 10 // +10 per correct
  if (body.score === session.total_questions) xpGained += 50 // 100% bonus
  xpGained += 25 // quiz completion bonus

  // Timer bonus XP was already included in score, add speed bonus
  const speedBonuses = body.speed_bonuses ?? 0
  xpGained += speedBonuses * 10 // extra 10 XP per speed bonus

  // Award XP
  const user = await db.select().from(users).where(eq(users.id, session.user_id)).get()
  if (user) {
    const newXp = user.xp + xpGained
    const newLevel = calcLevel(newXp)
    await db
      .update(users)
      .set({ xp: newXp, level: newLevel, last_active: now })
      .where(eq(users.id, session.user_id))
  }

  // Check badge triggers
  const newBadges = await checkAndAwardBadges(session.user_id)

  return c.json({ xp_gained: xpGained, new_badges: newBadges })
})

function calcLevel(xp: number): number {
  const thresholds = [0, 100, 250, 500, 1000]
  let level = 1
  for (let i = 0; i < thresholds.length; i++) {
    const threshold = thresholds[i]
    if (threshold !== undefined && xp >= threshold) level = i + 1
  }
  if (xp >= 1000) {
    level = 5 + Math.floor((xp - 1000) / 500)
  }
  return level
}

export default app
