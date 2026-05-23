import { Hono } from 'hono'
import { db } from '../db/client'
import { badge_definitions } from '../db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export type ConditionType = 'learnedCount' | 'quizCount' | 'perfectQuiz' | 'streak' | 'regionLearned'

export interface BadgeDefinition {
  id: string
  title: string
  description: string
  icon: string
  condition: {
    type: ConditionType
    threshold: number
    region?: string
  }
}

export interface BadgesExport {
  format: 'lernapp-badges'
  version: 1
  badges: BadgeDefinition[]
}

function rowToDef(row: typeof badge_definitions.$inferSelect): BadgeDefinition {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    icon: row.icon,
    condition: {
      type: row.condition_type as ConditionType,
      threshold: row.condition_threshold,
      ...(row.condition_region ? { region: row.condition_region } : {}),
    },
  }
}

const app = new Hono()

// GET /api/badge-definitions
app.get('/', async (c) => {
  const rows = await db.select().from(badge_definitions).orderBy(badge_definitions.sort_order)
  return c.json(rows.map(rowToDef))
})

// POST /api/badge-definitions
app.post('/', async (c) => {
  const body = await c.req.json<BadgeDefinition & { sort_order?: number }>()
  if (!body.id || !body.title || !body.condition?.type) {
    return c.json({ error: 'id, title and condition.type required' }, 400)
  }
  await db.insert(badge_definitions).values({
    id: body.id || uuidv4(),
    title: body.title,
    description: body.description ?? '',
    icon: body.icon ?? 'Award',
    condition_type: body.condition.type,
    condition_threshold: body.condition.threshold ?? 1,
    condition_region: body.condition.region ?? null,
    sort_order: body.sort_order ?? 0,
  })
  return c.json({ ok: true }, 201)
})

// PUT /api/badge-definitions/:id
app.put('/:id', async (c) => {
  const body = await c.req.json<Partial<BadgeDefinition> & { sort_order?: number }>()
  const update: Record<string, unknown> = {}
  if (body.title !== undefined) update['title'] = body.title
  if (body.description !== undefined) update['description'] = body.description
  if (body.icon !== undefined) update['icon'] = body.icon
  if (body.condition?.type !== undefined) update['condition_type'] = body.condition.type
  if (body.condition?.threshold !== undefined) update['condition_threshold'] = body.condition.threshold
  if (body.condition?.region !== undefined) update['condition_region'] = body.condition.region
  if (body.sort_order !== undefined) update['sort_order'] = body.sort_order

  await db.update(badge_definitions).set(update).where(eq(badge_definitions.id, c.req.param('id')))
  return c.json({ ok: true })
})

// DELETE /api/badge-definitions/:id
app.delete('/:id', async (c) => {
  await db.delete(badge_definitions).where(eq(badge_definitions.id, c.req.param('id')))
  return c.json({ ok: true })
})

// GET /api/badge-definitions/export  →  download as JSON file
app.get('/export', async (c) => {
  const rows = await db.select().from(badge_definitions).orderBy(badge_definitions.sort_order)
  const payload: BadgesExport = {
    format: 'lernapp-badges',
    version: 1,
    badges: rows.map(rowToDef),
  }
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="badges.json"',
    },
  })
})

// POST /api/badge-definitions/import  →  replace all from JSON
app.post('/import', async (c) => {
  const body = await c.req.json<BadgesExport>()
  if (body.format !== 'lernapp-badges' || !Array.isArray(body.badges)) {
    return c.json({ error: 'Invalid badge definitions format' }, 400)
  }
  // Replace all (upsert each)
  for (const [i, b] of body.badges.entries()) {
    await db.delete(badge_definitions).where(eq(badge_definitions.id, b.id))
    await db.insert(badge_definitions).values({
      id: b.id,
      title: b.title,
      description: b.description ?? '',
      icon: b.icon ?? 'Award',
      condition_type: b.condition.type,
      condition_threshold: b.condition.threshold ?? 1,
      condition_region: b.condition.region ?? null,
      sort_order: i,
    })
  }
  return c.json({ ok: true, count: body.badges.length })
})

export default app
