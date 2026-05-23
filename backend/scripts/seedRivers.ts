/**
 * Seeds the rivers table from rivers.json.
 * Data based on: https://de.wikipedia.org/wiki/Liste_der_längsten_Flüsse_der_Erde
 * Run: bun run scripts/seedRivers.ts
 */
import { db } from '../src/db/client'
import { rivers } from '../src/db/schema'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

interface RiverEntry {
  id: string
  rank: number
  name_de: string
  name_en: string
  length_km: number
  catchment_km2: number
  discharge_m3s: number
  continent: string
  countries: string[]
  outflow: string
  source_region: string
}

const data = JSON.parse(
  readFileSync(join(import.meta.dir, 'rivers.json'), 'utf-8')
) as RiverEntry[]

async function seed() {
  // Nur seeden wenn Tabelle leer (idempotent beim Container-Neustart)
  const existing = await db.select({ id: rivers.id }).from(rivers).limit(1)
  if (existing.length > 0) {
    console.log(`Rivers already seeded, skipping.`)
    process.exit(0)
  }

  console.log(`Seeding ${data.length} rivers...`)
  const now = Date.now()

  for (const river of data) {
    const row = {
      ...river,
      countries: JSON.stringify(river.countries),
      updated_at: now,
    }
    await db
      .insert(rivers)
      .values(row)
      .onConflictDoUpdate({
        target: rivers.id,
        set: {
          name_de: row.name_de,
          name_en: row.name_en,
          rank: row.rank,
          length_km: row.length_km,
          catchment_km2: row.catchment_km2,
          discharge_m3s: row.discharge_m3s,
          continent: row.continent,
          countries: row.countries,
          outflow: row.outflow,
          source_region: row.source_region,
          updated_at: now,
        },
      })
    console.log(`  ✓ ${river.name_de} (${river.length_km} km)`)
  }

  console.log('Done!')
  process.exit(0)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
