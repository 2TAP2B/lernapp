import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Badge, UserBadge } from '@/types'
import { usersApi } from '@/services/api'

// localStorage stores only IDs — all user data comes from the DB
const CURRENT_ID_KEY = 'lernapp_current_user'
const PROFILE_IDS_KEY = 'lernapp_profile_ids'

function getSavedIds(): string[] {
  try { return JSON.parse(localStorage.getItem(PROFILE_IDS_KEY) ?? '[]') } catch { return [] }
}
function saveIds(ids: string[]) {
  localStorage.setItem(PROFILE_IDS_KEY, JSON.stringify(ids))
}

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)
  const badges = ref<UserBadge[]>([])
  const allProfiles = ref<User[]>([])
  const pendingBadges = ref<Badge[]>([])

  const isLoggedIn = computed(() => currentUser.value !== null)
  const level = computed(() => currentUser.value?.level ?? 1)
  const xp = computed(() => currentUser.value?.xp ?? 0)
  const nextLevelXp = computed(() => {
    const thresholds = [100, 250, 500, 1000]
    const l = level.value
    if (l <= 4) return thresholds[l - 1] ?? 1000
    return 1000 + (l - 4) * 500
  })
  const xpProgress = computed(() => {
    const thresholds = [0, 100, 250, 500, 1000]
    const l = level.value
    const from = l <= 5 ? (thresholds[l - 1] ?? 0) : 1000 + (l - 5) * 500
    const to = nextLevelXp.value
    return Math.min(100, Math.round(((xp.value - from) / (to - from)) * 100))
  })

  /** Fetch all saved profile IDs from localStorage and load them fresh from the DB */
  async function loadProfiles() {
    const ids = getSavedIds()
    if (ids.length === 0) return
    const results = await Promise.allSettled(ids.map((id) => usersApi.getById(id)))
    allProfiles.value = results
      .filter((r): r is PromiseFulfilledResult<User> => r.status === 'fulfilled')
      .map((r) => r.value)
    // Prune IDs for users that no longer exist in DB
    const validIds = allProfiles.value.map((u) => u.id)
    saveIds(validIds)
  }

  async function createProfile(name: string, avatarId: number): Promise<User> {
    const user = await usersApi.create(name, avatarId)
    allProfiles.value.push(user)
    saveIds(allProfiles.value.map((u) => u.id))
    return user
  }

  async function selectProfile(userId: string) {
    const user = await usersApi.getById(userId)
    currentUser.value = user
    localStorage.setItem(CURRENT_ID_KEY, userId)
    await loadBadges()
  }

  async function refreshUser() {
    if (!currentUser.value) return
    try {
      const fresh = await usersApi.getById(currentUser.value.id)
      currentUser.value = fresh
      const idx = allProfiles.value.findIndex((p) => p.id === fresh.id)
      if (idx !== -1) allProfiles.value[idx] = fresh
    } catch {}
  }

  async function loadBadges() {
    if (!currentUser.value) return
    badges.value = await usersApi.getBadges(currentUser.value.id)
  }

  async function addXp(amount: number): Promise<{ levelUp: boolean; newBadges: Badge[] }> {
    if (!currentUser.value) return { levelUp: false, newBadges: [] }
    const result = await usersApi.addXp(currentUser.value.id, amount)
    currentUser.value.xp = result.xp
    currentUser.value.level = result.level
    currentUser.value.streak_days = result.streak_days
    const idx = allProfiles.value.findIndex((p) => p.id === currentUser.value!.id)
    if (idx !== -1) allProfiles.value[idx] = { ...allProfiles.value[idx], xp: result.xp, level: result.level, streak_days: result.streak_days }
    if (result.new_badges.length > 0) {
      pendingBadges.value.push(...result.new_badges)
      await loadBadges()
    }
    return { levelUp: result.level_up, newBadges: result.new_badges }
  }

  function clearPendingBadges() {
    pendingBadges.value = []
  }

  async function initialize() {
    // Migrate old format if present
    const oldProfiles = localStorage.getItem('lernapp_profiles')
    if (oldProfiles) {
      try {
        const parsed: User[] = JSON.parse(oldProfiles)
        const existingIds = getSavedIds()
        const merged = [...new Set([...existingIds, ...parsed.map((u) => u.id)])]
        saveIds(merged)
      } catch {}
      localStorage.removeItem('lernapp_profiles')
    }

    await loadProfiles()

    const savedId = localStorage.getItem(CURRENT_ID_KEY)
    if (savedId) {
      const profile = allProfiles.value.find((p) => p.id === savedId)
      if (profile) {
        currentUser.value = profile
        loadBadges()
      }
    }
  }

  return {
    currentUser,
    badges,
    allProfiles,
    pendingBadges,
    isLoggedIn,
    level,
    xp,
    nextLevelXp,
    xpProgress,
    loadProfiles,
    createProfile,
    selectProfile,
    refreshUser,
    loadBadges,
    addXp,
    clearPendingBadges,
    initialize,
  }
})
