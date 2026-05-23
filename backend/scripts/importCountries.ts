/**
 * Imports countries_de.json into the local SQLite DB, overwriting all rows.
 * Run: bun run scripts/importCountries.ts
 */

import { db } from '../src/db/client'
import { countries } from '../src/db/schema'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const raw = readFileSync(join(import.meta.dir, 'countries_de.json'), 'utf-8')
const data = JSON.parse(raw) as Record<string, {
  id: string
  name_en: string
  name_de: string
  capital: string | null
  region: string | null
  subregion: string | null
  flag_svg: string
  flag_png: string
  population: number
  languages: string[]
  currencies: string[]
}>

const now = Date.now()
let count = 0

for (const entry of Object.values(data)) {
  await db
    .insert(countries)
    .values({
      id: entry.id,
      name_de: entry.name_de,
      name_en: entry.name_en,
      capital: entry.capital,
      region: entry.region,
      subregion: entry.subregion,
      flag_svg: entry.flag_svg,
      flag_png: entry.flag_png,
      population: entry.population,
      languages: JSON.stringify(entry.languages),
      currencies: JSON.stringify(entry.currencies),
      calling_code: null,
      area: null,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: countries.id,
      set: {
        name_de: entry.name_de,
        name_en: entry.name_en,
        capital: entry.capital,
        region: entry.region,
        subregion: entry.subregion,
        flag_svg: entry.flag_svg,
        flag_png: entry.flag_png,
        population: entry.population,
        languages: JSON.stringify(entry.languages),
        currencies: JSON.stringify(entry.currencies),
        updated_at: now,
      },
    })
  count++
}

console.log(`✓ Imported/updated ${count} countries`)
