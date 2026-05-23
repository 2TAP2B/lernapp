import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { db } from './db/client'
import { countries } from './db/schema'
import countriesRoute from './routes/countries'
import quizRoute from './routes/quiz'
import userRoute from './routes/user'
import catalogsRoute from './routes/catalogs'
import badgeDefsRoute from './routes/badgeDefs'
import riversRoute from './routes/rivers'
import { syncCountries } from './services/countriesSync'
import { startSyncJob } from './jobs/syncJob'
import { seedDefaultBadges, getAllBadgeDefinitions } from './services/badgeService'

const app = new Hono()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL ?? '*',
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
)

app.route('/api/countries', countriesRoute)
app.route('/api/quiz', quizRoute)
app.route('/api/users', userRoute)
app.route('/api/catalogs', catalogsRoute)
app.route('/api/badge-definitions', badgeDefsRoute)
app.route('/api/rivers', riversRoute)

// GET /api/badges — public list of all badge definitions
app.get('/api/badges', async (c) => c.json(await getAllBadgeDefinitions()))

app.get('/health', (c) => c.json({ status: 'ok', time: Date.now() }))

// Initial data sync if DB is empty
async function bootstrap() {
  try {
    const result = await db.select({ id: countries.id }).from(countries).limit(1)
    if (result.length === 0) {
      console.log('[bootstrap] No countries found, running initial sync...')
      await syncCountries()
    }
    await seedDefaultBadges()
  } catch (err) {
    console.error('[bootstrap] DB not ready or sync failed:', err)
  }
  startSyncJob()
}

const port = parseInt(process.env.PORT ?? '3001', 10)

bootstrap().then(() => {
  console.log(`Backend running on port ${port}`)
})

export default {
  port,
  fetch: app.fetch,
}
