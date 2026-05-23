import { db } from '../db/client'
import { countries } from '../db/schema'
import { eq } from 'drizzle-orm'

interface RestCountry {
  cca2: string
  name: { common: string }
  translations?: Record<string, { common: string }>
  capital?: string[]
  region: string
  population: number
  languages?: Record<string, string>
  currencies?: Record<string, { name: string; symbol: string }>
  flags: { svg: string; png: string }
  area?: number
}

export async function syncCountries(): Promise<void> {
  console.log('[countriesSync] Starting sync from REST Countries API...')

  const response = await fetch(
    'https://restcountries.com/v3.1/all?fields=cca2,name,translations,capital,region,population,languages,currencies,flags,area'
  )

  if (!response.ok) {
    throw new Error(`REST Countries API error: ${response.status}`)
  }

  const data = (await response.json()) as RestCountry[]
  const now = Date.now()

  for (const c of data) {
    const id = c.cca2.toLowerCase()
    const name_de = c.translations?.['deu']?.common ?? c.name.common
    const name_en = c.name.common
    const capital = c.capital?.[0] ?? null
    const languages = c.languages ? JSON.stringify(Object.values(c.languages)) : null
    const currencies = c.currencies
      ? JSON.stringify(
          Object.values(c.currencies).map((v) => `${v.name} (${v.symbol})`)
        )
      : null

    const calling_code = null

    await db
      .insert(countries)
      .values({
        id,
        name_de,
        name_en,
        capital,
        region: c.region,
        subregion: null,
        population: c.population,
        languages,
        currencies,
        flag_svg: c.flags.svg,
        flag_png: c.flags.png,
        calling_code,
        area: c.area ?? null,
        updated_at: now,
      })
      .onConflictDoUpdate({
        target: countries.id,
        set: {
          name_de,
          name_en,
          capital,
          region: c.region,
          subregion: null,
          population: c.population,
          languages,
          currencies,
          flag_svg: c.flags.svg,
          flag_png: c.flags.png,
          calling_code,
          area: c.area ?? null,
          updated_at: now,
        },
      })
  }

  console.log(`[countriesSync] Synced ${data.length} countries.`)
}
