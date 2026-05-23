import { Hono } from 'hono'
import { db } from '../db/client'
import { countries } from '../db/schema'
import { eq, sql } from 'drizzle-orm'
import { syncCountries } from '../services/countriesSync'

const app = new Hono()

// GET /api/countries
app.get('/', async (c) => {
  const region = c.req.query('region')
  const rows = region
    ? await db.select().from(countries).where(eq(countries.region, region))
    : await db.select().from(countries)
  return c.json(rows)
})

// GET /api/countries/random?n=10
app.get('/random', async (c) => {
  const n = parseInt(c.req.query('n') ?? '10', 10)
  const rows = await db
    .select()
    .from(countries)
    .orderBy(sql`RANDOM()`)
    .limit(n)
  return c.json(rows)
})

// GET /api/countries/:id
app.get('/:id', async (c) => {
  const id = c.req.param('id').toLowerCase()
  const row = await db.select().from(countries).where(eq(countries.id, id)).get()
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json(row)
})

// POST /api/countries/sync (admin re-sync)
app.post('/sync', async (c) => {
  void syncCountries()
  return c.json({ status: 'sync started' })
})

export default app
