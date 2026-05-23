import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Country, LearnProgress } from '@/types'
import { countriesApi, usersApi } from '@/services/api'
import { useUserStore } from './userStore'

const CACHE_KEY = 'lernapp_countries_cache'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24h

export const useFlagStore = defineStore('flags', () => {
  const countries = ref<Country[]>([])
  const progress = ref<Map<string, LearnProgress>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const learnedCount = computed(() =>
    Array.from(progress.value.values()).filter((p) => p.learned).length
  )
  const seenCount = computed(() => progress.value.size)

  const seenCountries = computed(() =>
    countries.value.filter((c) => progress.value.has(c.id))
  )

  function getProgress(countryId: string): LearnProgress | undefined {
    return progress.value.get(countryId)
  }

  async function loadCountries() {
    // Try cache first
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_TTL && Array.isArray(data) && data.length > 0) {
          countries.value = data
          return
        }
      } catch {}
    }

    loading.value = true
    error.value = null
    try {
      const data = await countriesApi.getAll()
      countries.value = data
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
    } catch (e) {
      error.value = 'Ups! Länder konnten nicht geladen werden. Bitte prüfe deine Verbindung.'
      // Use cached data even if expired
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        try {
          const { data } = JSON.parse(cached)
          countries.value = data
        } catch {}
      }
    } finally {
      loading.value = false
    }
  }

  async function loadProgress() {
    const userStore = useUserStore()
    if (!userStore.currentUser) return
    try {
      const rows = await usersApi.getProgress(userStore.currentUser.id)
      progress.value = new Map(rows.map((r) => [r.country_id, r]))
    } catch {}
  }

  async function recordSeen(countryId: string): Promise<{ xpGained: number }> {
    const userStore = useUserStore()
    if (!userStore.currentUser) return { xpGained: 0 }
    try {
      const result = await usersApi.recordProgress(userStore.currentUser.id, countryId)
      // Update local progress
      await loadProgress()
      // Update user XP locally
      if (result.xp_gained > 0 && userStore.currentUser) {
        userStore.currentUser.xp += result.xp_gained
        userStore.currentUser.level = calcLevel(userStore.currentUser.xp)
      }
      if (result.new_badges.length > 0) {
        userStore.pendingBadges.push(...result.new_badges)
        await userStore.loadBadges()
      }
      return { xpGained: result.xp_gained }
    } catch {
      return { xpGained: 0 }
    }
  }

  function calcLevel(xp: number): number {
    const thresholds = [0, 100, 250, 500, 1000]
    let level = 1
    for (let i = 0; i < thresholds.length; i++) {
      const t = thresholds[i]
      if (t !== undefined && xp >= t) level = i + 1
    }
    if (xp >= 1000) level = 5 + Math.floor((xp - 1000) / 500)
    return level
  }

  return {
    countries,
    progress,
    loading,
    error,
    learnedCount,
    seenCount,
    seenCountries,
    getProgress,
    loadCountries,
    loadProgress,
    recordSeen,
  }
})
