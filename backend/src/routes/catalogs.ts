import { Hono } from 'hono'
import { db } from '../db/client'
import { quiz_catalogs } from '../db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export interface CustomQuestion {
  id: string
  question: string
  choices: string[]
  correct: string
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

const app = new Hono()

// GET /api/catalogs
app.get('/', async (c) => {
  const rows = await db.select().from(quiz_catalogs)
  return c.json(
    rows.map((r) => ({
      ...r,
      questions: JSON.parse(r.questions) as CustomQuestion[],
    }))
  )
})

// POST /api/catalogs
app.post('/', async (c) => {
  const body = await c.req.json<{
    title: string
    description?: string
    icon?: string
    questions: CustomQuestion[]
  }>()
  if (!body.title || !Array.isArray(body.questions)) {
    return c.json({ error: 'title and questions required' }, 400)
  }
  const now = Date.now()
  const id = uuidv4()
  await db.insert(quiz_catalogs).values({
    id,
    title: body.title,
    description: body.description ?? '',
    icon: body.icon ?? 'HelpCircle',
    questions: JSON.stringify(body.questions),
    created_at: now,
    updated_at: now,
  })
  return c.json({ id }, 201)
})

// GET /api/catalogs/:id
app.get('/:id', async (c) => {
  const row = await db
    .select()
    .from(quiz_catalogs)
    .where(eq(quiz_catalogs.id, c.req.param('id')))
    .get()
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json({ ...row, questions: JSON.parse(row.questions) as CustomQuestion[] })
})

// PUT /api/catalogs/:id
app.put('/:id', async (c) => {
  const body = await c.req.json<{
    title?: string
    description?: string
    icon?: string
    questions?: CustomQuestion[]
  }>()
  const update: Record<string, unknown> = { updated_at: Date.now() }
  if (body.title !== undefined) update['title'] = body.title
  if (body.description !== undefined) update['description'] = body.description
  if (body.icon !== undefined) update['icon'] = body.icon
  if (body.questions !== undefined) update['questions'] = JSON.stringify(body.questions)

  await db.update(quiz_catalogs).set(update).where(eq(quiz_catalogs.id, c.req.param('id')))
  return c.json({ ok: true })
})

// DELETE /api/catalogs/:id
app.delete('/:id', async (c) => {
  await db.delete(quiz_catalogs).where(eq(quiz_catalogs.id, c.req.param('id')))
  return c.json({ ok: true })
})

// GET /api/catalogs/:id/export  →  download as JSON file
app.get('/:id/export', async (c) => {
  const row = await db
    .select()
    .from(quiz_catalogs)
    .where(eq(quiz_catalogs.id, c.req.param('id')))
    .get()
  if (!row) return c.json({ error: 'Not found' }, 404)

  const payload: CatalogExport = {
    format: 'lernapp-catalog',
    version: 1,
    id: row.id,
    title: row.title,
    description: row.description,
    icon: row.icon,
    questions: JSON.parse(row.questions) as CustomQuestion[],
  }
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${row.id}.catalog.json"`,
    },
  })
})

// POST /api/catalogs/import  →  create from exported JSON
app.post('/import', async (c) => {
  const body = await c.req.json<CatalogExport>()
  if (body.format !== 'lernapp-catalog' || !Array.isArray(body.questions)) {
    return c.json({ error: 'Invalid catalog format' }, 400)
  }
  const now = Date.now()
  const id = body.id ?? uuidv4()
  // Upsert: delete if exists, then insert
  await db.delete(quiz_catalogs).where(eq(quiz_catalogs.id, id))
  await db.insert(quiz_catalogs).values({
    id,
    title: body.title,
    description: body.description ?? '',
    icon: body.icon ?? 'HelpCircle',
    questions: JSON.stringify(body.questions),
    created_at: now,
    updated_at: now,
  })
  return c.json({ id }, 201)
})

export default app
