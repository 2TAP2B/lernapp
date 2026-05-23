<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-slate-900 dark:to-slate-800 p-4 pb-10">

    <!-- Header -->
    <header class="flex items-center justify-between mb-5 pt-2">
      <button class="flex items-center gap-3 min-w-0" @click="showProfiles = true" aria-label="Profil wechseln">
        <AvatarIcon :avatar-id="userStore.currentUser?.avatar_id ?? 0" />
        <div class="min-w-0">
          <p class="font-extrabold text-slate-800 dark:text-white text-base leading-tight truncate">
            {{ userStore.currentUser?.name }}
          </p>
          <StreakDisplay :days="userStore.currentUser?.streak_days ?? 0" />
        </div>
      </button>
      <button
        class="p-2.5 rounded-full bg-white dark:bg-slate-700 shadow"
        @click="showMenu = true"
        aria-label="Menü öffnen"
      >
        <Menu class="w-5 h-5 text-slate-600 dark:text-slate-300" />
      </button>
    </header>

    <!-- XP Bar -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl px-4 pt-4 pb-3 shadow mb-3">
      <XpBar
        :level="userStore.level"
        :xp="userStore.xp"
        :next-level-xp="userStore.nextLevelXp"
        :progress="userStore.xpProgress"
      />
    </div>

    <!-- Badges (below level progress) -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 shadow mb-5">
      <div v-if="userStore.badges.length === 0" class="flex items-center gap-2 text-slate-400 text-xs py-0.5">
        <Award class="w-4 h-4 text-amber-300" />
        <span>Noch keine Badges – fang an zu lernen!</span>
      </div>
      <div v-else class="flex gap-2 overflow-x-auto no-scrollbar">
        <div
          v-for="badge in earnedBadgeDetails"
          :key="badge.id"
          class="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 shrink-0"
          :title="badge.description"
        >
          <component :is="getIcon(badge.icon)" class="w-3.5 h-3.5 text-amber-500" />
          <span class="text-xs font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">{{ badge.title }}</span>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-3 mb-5">
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow text-center">
        <p class="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{{ flagStore.learnedCount + riverStore.learnedCount }}</p>
        <p class="text-xs text-slate-500 mt-0.5">Gelernt</p>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow text-center">
        <p class="text-2xl font-extrabold text-violet-600 dark:text-violet-400">{{ flagStore.seenCount + riverStore.seenCount }}</p>
        <p class="text-xs text-slate-500 mt-0.5">Gesehen</p>
      </div>
    </div>

    <!-- Main actions -->
    <div class="space-y-3">

      <!-- Lernen -->
      <button
        class="w-full flex items-center gap-4 p-5 rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.01] transition-all text-white"
        style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
        @click="router.push({ name: 'learn-select' })"
      >
        <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
          <BookOpen class="w-7 h-7 text-white" />
        </div>
        <div class="text-left flex-1">
          <p class="font-extrabold text-xl">Lernen</p>
          <p class="text-indigo-200 text-sm">{{ flagStore.learnedCount + riverStore.learnedCount }} Karten gelernt</p>
        </div>
        <ChevronRight class="w-6 h-6 text-white/60 shrink-0" />
      </button>

      <!-- Quiz -->
      <button
        class="w-full flex items-center gap-4 p-5 rounded-2xl shadow-md hover:shadow-lg transition-all text-white"
        :class="flagStore.seenCount >= 10 ? 'hover:scale-[1.01]' : 'opacity-60 cursor-not-allowed'"
        style="background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%)"
        @click="goQuiz"
      >
        <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
          <Trophy class="w-7 h-7 text-white" />
        </div>
        <div class="text-left flex-1">
          <p class="font-extrabold text-xl">Quiz</p>
          <p class="text-pink-200 text-sm">
            {{ flagStore.seenCount < 10 ? `Noch ${10 - flagStore.seenCount} Karten anschauen` : 'Teste dein Wissen!' }}
          </p>
        </div>
        <ChevronRight class="w-6 h-6 text-white/60 shrink-0" />
      </button>

      <!-- Entdecken -->
      <button
        class="w-full flex items-center gap-4 p-5 rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.01] transition-all text-white"
        style="background: linear-gradient(135deg, #0891b2 0%, #0d9488 100%)"
        @click="router.push({ name: 'countries' })"
      >
        <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
          <Search class="w-7 h-7 text-white" />
        </div>
        <div class="text-left flex-1">
          <p class="font-extrabold text-xl">Entdecken</p>
          <p class="text-cyan-200 text-sm">Länder &amp; Flüsse durchsuchen</p>
        </div>
        <ChevronRight class="w-6 h-6 text-white/60 shrink-0" />
      </button>

    </div>

    <!-- Profile switcher sheet -->
    <Teleport to="body">
      <div v-if="showProfiles" class="fixed inset-0 bg-black/50 z-50 flex items-end" @click.self="showProfiles = false">
        <div class="w-full bg-white dark:bg-slate-800 rounded-t-3xl p-6 pb-10">
          <h3 class="font-extrabold text-xl text-slate-800 dark:text-white mb-4">Profil wechseln</h3>
          <div class="grid grid-cols-3 gap-3 mb-4">
            <button
              v-for="profile in userStore.allProfiles"
              :key="profile.id"
              class="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all"
              :class="profile.id === userStore.currentUser?.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent bg-slate-100 dark:bg-slate-700'"
              @click="switchProfile(profile.id)"
            >
              <AvatarIcon :avatar-id="profile.avatar_id" />
              <span class="text-xs font-bold">{{ profile.name }}</span>
            </button>
            <button
              class="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 dark:bg-slate-700"
              @click="goOnboarding"
            >
              <div class="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                <Plus class="w-7 h-7 text-slate-400" />
              </div>
              <span class="text-xs font-bold text-slate-400">Neu</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Hamburger menu sheet -->
    <Teleport to="body">
      <div v-if="showMenu" class="fixed inset-0 bg-black/50 z-50 flex items-end" @click.self="showMenu = false">
        <div class="w-full bg-white dark:bg-slate-800 rounded-t-3xl p-6 pb-10">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-extrabold text-xl text-slate-800 dark:text-white">Einstellungen</h3>
            <button @click="showMenu = false" class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
              <X class="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div class="space-y-2">
            <button
              class="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              @click="navigate('catalogs')"
            >
              <div class="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center shrink-0">
                <ListChecks class="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div class="text-left flex-1">
                <p class="font-extrabold text-slate-800 dark:text-white text-sm">Kataloge verwalten</p>
                <p class="text-xs text-slate-400">Eigene Quiz-Kataloge erstellen</p>
              </div>
              <ChevronRight class="w-4 h-4 text-slate-400" />
            </button>
            <button
              class="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              @click="navigate('badges')"
            >
              <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
                <Settings class="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div class="text-left flex-1">
                <p class="font-extrabold text-slate-800 dark:text-white text-sm">Badges verwalten</p>
                <p class="text-xs text-slate-400">Badge-Regeln anpassen</p>
              </div>
              <ChevronRight class="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { BookOpen, Trophy, Search, ChevronRight, Award, Plus, Star, Globe, Plane, Crown, Flame, Zap, ListChecks, Settings, Menu, X } from '@lucide/vue'
import { useUserStore } from '@/stores/userStore'
import { useFlagStore } from '@/stores/flagStore'
import { useRiverStore } from '@/stores/riverStore'
import XpBar from '@/components/ui/XpBar.vue'
import StreakDisplay from '@/components/ui/StreakDisplay.vue'
import AvatarIcon from '@/components/ui/AvatarIcon.vue'
import type { Badge } from '@/types'

const userStore = useUserStore()
const flagStore = useFlagStore()
const riverStore = useRiverStore()
const router = useRouter()
const showProfiles = ref(false)
const showMenu = ref(false)

const ALL_BADGES: Badge[] = [
  { id: 'first_learn',   title: 'Erste Schritte',  description: '1. Land gelernt',                  icon: 'Star' },
  { id: 'ten_learned',   title: 'Wissenshungrig',   description: '10 Länder gelernt',                icon: 'BookOpen' },
  { id: 'first_quiz',    title: 'Quiz-Starter',     description: 'Erstes Quiz gespielt',             icon: 'Trophy' },
  { id: 'perfect_quiz',  title: 'Perfektionist',    description: 'Quiz mit 100% bestanden',          icon: 'Award' },
  { id: 'europe_master', title: 'Europa-Experte',   description: '20 europ. Länder gelernt',         icon: 'Globe' },
  { id: 'world_traveler',title: 'Weltreisender',    description: '50 Länder gelernt',                icon: 'Plane' },
  { id: 'all_knowing',   title: 'Allwissend',       description: 'Alle Länder gelernt',              icon: 'Crown' },
  { id: 'streak_7',      title: 'Fleißig',          description: '7 Tage Streak',                    icon: 'Flame' },
  { id: 'speed_thinker', title: 'Schnell-Denker',   description: '5x Timer-Bonus in einer Runde',   icon: 'Zap' },
]

const iconMap: Record<string, unknown> = { Star, BookOpen, Trophy, Award, Globe, Plane, Crown, Flame, Zap }
function getIcon(name: string) { return iconMap[name] ?? Star }

const earnedBadgeDetails = computed(() =>
  userStore.badges
    .map((ub) => ALL_BADGES.find((b) => b.id === ub.badge_id))
    .filter(Boolean) as Badge[]
)

function goQuiz() {
  if (flagStore.seenCount < 10) return
  router.push({ name: 'quiz' })
}

function navigate(name: string) {
  showMenu.value = false
  router.push({ name })
}

async function switchProfile(id: string) {
  await userStore.selectProfile(id)
  await flagStore.loadProgress()
  showProfiles.value = false
}

function goOnboarding() {
  showProfiles.value = false
  router.push({ name: 'onboarding' })
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
