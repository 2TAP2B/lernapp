/**
 * Exports all rivers from the local DB into rivers.json.
 * Run with: bun run scripts/exportRivers.ts
 *
 * Output: scripts/rivers.json
 */

import { db } from '../src/db/client'
import { rivers } from '../src/db/schema'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const rows = await db.select().from(rivers).all()

const output = rows.map((row) => ({
  id: row.id,
  rank: row.rank,
  name_de: row.name_de,
  name_en: row.name_en,
  length_km: row.length_km,
  catchment_km2: row.catchment_km2,
  discharge_m3s: row.discharge_m3s,
  continent: row.continent,
  countries: row.countries ? JSON.parse(row.countries) : [],
  outflow: row.outflow,
  source_region: row.source_region,
}))

const outPath = join(import.meta.dir, 'rivers.json')
writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8')
console.log(`Exported ${output.length} rivers → ${outPath}`)
process.exit(0)
