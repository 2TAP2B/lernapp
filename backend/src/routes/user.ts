import { Hono } from 'hono'
import { db } from '../db/client'
import { users, learn_progress, user_badges, countries } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { getAllBadgeDefinitions, checkAndAwardBadges } from '../services/badgeService'

const app = new Hono()

// GET /api/users/:id
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const user = await db.select().from(users).where(eq(users.id, id)).get()
  if (!user) return c.json({ error: 'Not found' }, 404)
  return c.json(user)
})

// POST /api/users
app.post('/', async (c) => {
  const body = await c.req.json<{ name: string; avatar_id: number }>()
  if (!body.name || body.name.trim().length === 0) {
    return c.json({ error: 'Name is required' }, 400)
  }
  const id = uuidv4()
  const now = Date.now()
  await db.insert(users).values({
    id,
    name: body.name.trim(),
    avatar_id: body.avatar_id ?? 0,
    xp: 0,
    level: 1,
    streak_days: 0,
    last_active: now,
    created_at: now,
  })
  return c.json({ id, name: body.name.trim(), avatar_id: body.avatar_id ?? 0, xp: 0, level: 1, streak_days: 0 }, 201)
})

// PATCH /api/users/:id/xp
app.patch('/:id/xp', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ xp: number }>()
  const user = await db.select().from(users).where(eq(users.id, id)).get()
  if (!user) return c.json({ error: 'Not found' }, 404)

  const newXp = user.xp + (body.xp ?? 0)
  const newLevel = calcLevel(newXp)
  const now = Date.now()

  // Streak logic: if last_active was yesterday, increment streak
  let streak = user.streak_days
  if (user.last_active) {
    const daysSince = Math.floor((now - user.last_active) / 86400000)
    if (daysSince === 1) streak += 1
    else if (daysSince > 1) streak = 1
  } else {
    streak = 1
  }

  await db.update(users).set({ xp: newXp, level: newLevel, streak_days: streak, last_active: now }).where(eq(users.id, id))

  const newBadges = await checkAndAwardBadges(id)
  return c.json({ xp: newXp, level: newLevel, streak_days: streak, level_up: newLevel > user.level, new_badges: newBadges })
})

// GET /api/users/:id/progress
app.get('/:id/progress', async (c) => {
  const id = c.req.param('id')
  const rows = await db.select().from(learn_progress).where(eq(learn_progress.user_id, id))
  return c.json(rows)
})

// POST /api/users/:id/progress
app.post('/:id/progress', async (c) => {
  const userId = c.req.param('id')
  const body = await c.req.json<{ country_id: string }>()
  if (!body.country_id) return c.json({ error: 'country_id required' }, 400)

  const now = Date.now()
  const existing = await db
    .select()
    .from(learn_progress)
    .where(and(eq(learn_progress.user_id, userId), eq(learn_progress.country_id, body.country_id)))
    .get()

  let xpGained = 0
  let isNew = false

  if (!existing) {
    await db.insert(learn_progress).values({
      id: uuidv4(),
      user_id: userId,
      country_id: body.country_id,
      seen_count: 1,
      last_seen: now,
      learned: false,
    })
    xpGained = 5 // +5 XP first time
    isNew = true
  } else {
    const newCount = existing.seen_count + 1
    const nowLearned = newCount >= 3
    const justLearned = nowLearned && !existing.learned

    await db
      .update(learn_progress)
      .set({ seen_count: newCount, last_seen: now, learned: nowLearned })
      .where(eq(learn_progress.id, existing.id))

    if (justLearned) xpGained = 15 // +15 XP when marked as learned
  }

  // Apply XP if gained
  if (xpGained > 0) {
    const user = await db.select().from(users).where(eq(users.id, userId)).get()
    if (user) {
      const newXp = user.xp + xpGained
      const newLevel = calcLevel(newXp)
      await db.update(users).set({ xp: newXp, level: newLevel, last_active: now }).where(eq(users.id, userId))
    }
  }

  const newBadges = await checkAndAwardBadges(userId)
  return c.json({ xp_gained: xpGained, is_new: isNew, new_badges: newBadges })
})

// GET /api/badges
app.get('/badges/all', async (c) => {
  return c.json(await getAllBadgeDefinitions())
})

// GET /api/users/:id/badges
app.get('/:id/badges', async (c) => {
  const id = c.req.param('id')
  const rows = await db.select().from(user_badges).where(eq(user_badges.user_id, id))
  return c.json(rows)
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
