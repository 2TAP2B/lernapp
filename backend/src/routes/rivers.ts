import { Hono } from 'hono'
import { db } from '../db/client'
import { rivers, river_progress } from '../db/schema'
import { eq, sql } from 'drizzle-orm'
import { v4 as uuid } from 'uuid'

const app = new Hono()

// GET /api/rivers
app.get('/', async (c) => {
  const continent = c.req.query('continent')
  const rows = continent
    ? await db.select().from(rivers).where(eq(rivers.continent, continent))
    : await db.select().from(rivers).orderBy(rivers.rank)
  return c.json(rows)
})

// GET /api/rivers/random?n=10
app.get('/random', async (c) => {
  const n = parseInt(c.req.query('n') ?? '10', 10)
  const rows = await db
    .select()
    .from(rivers)
    .orderBy(sql`RANDOM()`)
    .limit(n)
  return c.json(rows)
})

// GET /api/rivers/:id
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const row = await db.select().from(rivers).where(eq(rivers.id, id)).get()
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json(row)
})

// GET /api/rivers/progress/:userId
app.get('/progress/:userId', async (c) => {
  const userId = c.req.param('userId')
  const rows = await db
    .select()
    .from(river_progress)
    .where(eq(river_progress.user_id, userId))
  return c.json(rows)
})

// POST /api/rivers/progress — upsert seen
app.post('/progress', async (c) => {
  const body = await c.req.json<{ user_id: string; river_id: string }>()
  const { user_id, river_id } = body

  const existing = await db
    .select()
    .from(river_progress)
    .where(eq(river_progress.user_id, user_id))
    .all()

  const record = existing.find((r) => r.river_id === river_id)
  const now = Date.now()

  if (record) {
    await db
      .update(river_progress)
      .set({
        seen_count: record.seen_count + 1,
        last_seen: now,
        learned: record.seen_count + 1 >= 3,
      })
      .where(eq(river_progress.id, record.id))
    return c.json({ ...record, seen_count: record.seen_count + 1, last_seen: now })
  }

  const newRecord = {
    id: uuid(),
    user_id,
    river_id,
    seen_count: 1,
    last_seen: now,
    learned: false,
  }
  await db.insert(river_progress).values(newRecord)
  return c.json(newRecord, 201)
})

export default app
