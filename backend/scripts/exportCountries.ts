/**
 * Exports all countries from the local DB into a translation-ready JSON.
 * Run with: bun run scripts/exportCountries.ts
 *
 * Output: scripts/countries_export.json
 *
 * Format per entry:
 *   "de": {
 *     "id": "de",
 *     "name_en": "Germany",
 *     "name_de": "Deutschland",       ← translate this
 *     "capital": "Berlin",            ← translate if desired
 *     "region": "Europe",
 *     "subregion": "Western Europe",  ← translate if desired
 *     "flag_svg": "https://...",
 *     "flag_png": "https://...",
 *     "population": 83491249,
 *     "area": 357114,
 *     "languages": ["German"],
 *     "currencies": ["euro (€)"]
 *   }
 */

import { db } from '../src/db/client'
import { countries } from '../src/db/schema'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const rows = await db.select().from(countries).all()

const output: Record<string, object> = {}

for (const row of rows) {
  output[row.id] = {
    id: row.id,
    name_en: row.name_en,
    name_de: row.name_de,
    capital: row.capital,
    region: row.region,
    subregion: row.subregion,
    flag_svg: row.flag_svg,
    flag_png: row.flag_png,
    population: row.population,
    area: row.area,
    languages: row.languages ? JSON.parse(row.languages) : [],
    currencies: row.currencies ? JSON.parse(row.currencies) : [],
  }
}

const outPath = join(import.meta.dir, 'countries_export.json')
writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8')

console.log(`✓ Exported ${rows.length} countries to ${outPath}`)
