import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { River, RiverProgress } from '@/types'
import { riversApi } from '@/services/api'
import { useUserStore } from './userStore'

const CACHE_KEY = 'lernapp_rivers_cache'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days (river data rarely changes)

export const useRiverStore = defineStore('rivers', () => {
  const rivers = ref<River[]>([])
  const progress = ref<Map<string, RiverProgress>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const learnedCount = computed(() =>
    Array.from(progress.value.values()).filter((p) => p.learned).length
  )
  const seenCount = computed(() => progress.value.size)

  function getProgress(riverId: string): RiverProgress | undefined {
    return progress.value.get(riverId)
  }

  async function loadRivers() {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_TTL && Array.isArray(data) && data.length > 0) {
          rivers.value = data
          return
        }
      } catch {}
    }

    loading.value = true
    error.value = null
    try {
      const data = await riversApi.getAll()
      rivers.value = data
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
    } catch {
      error.value = 'Flüsse konnten nicht geladen werden.'
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        try { rivers.value = JSON.parse(cached).data } catch {}
      }
    } finally {
      loading.value = false
    }
  }

  async function loadProgress() {
    const userStore = useUserStore()
    if (!userStore.currentUser) return
    try {
      const rows = await riversApi.getProgress(userStore.currentUser.id)
      progress.value = new Map(rows.map((r) => [r.river_id, r]))
    } catch {}
  }

  async function recordSeen(riverId: string): Promise<{ xpGained: number }> {
    const userStore = useUserStore()
    if (!userStore.currentUser) return { xpGained: 0 }
    try {
      const prev = progress.value.get(riverId)
      const result = await riversApi.recordProgress(userStore.currentUser.id, riverId)
      progress.value.set(riverId, result)

      // Award XP only on first/second/third view
      const isNew = !prev
      const xpGained = isNew ? 5 : result.seen_count === 3 ? 10 : 0  // 10 XP for learned
      if (xpGained > 0 && userStore.currentUser) {
        userStore.currentUser.xp += xpGained
      }
      return { xpGained }
    } catch {
      return { xpGained: 0 }
    }
  }

  return {
    rivers,
    progress,
    loading,
    error,
    learnedCount,
    seenCount,
    getProgress,
    loadRivers,
    loadProgress,
    recordSeen,
  }
})
