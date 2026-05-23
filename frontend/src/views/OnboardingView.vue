<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-slate-900 dark:to-indigo-900 flex flex-col">
    <!-- Step 1: Profile selection or create -->
    <div v-if="step === 'select'" class="flex-1 flex flex-col items-center justify-center p-6">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-extrabold text-indigo-700 dark:text-indigo-300 mb-2">Willkommen!</h1>
        <p class="text-slate-600 dark:text-slate-400 text-lg">Wer lernt heute?</p>
      </div>

      <!-- Existing profiles (Netflix-style) -->
      <div v-if="userStore.allProfiles.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 w-full max-w-md">
        <button
          v-for="profile in userStore.allProfiles"
          :key="profile.id"
          class="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl hover:scale-105 transition-all"
          @click="selectProfile(profile.id)"
          :aria-label="`Profil von ${profile.name} auswählen`"
        >
          <AvatarIcon :avatar-id="profile.avatar_id" />
          <span class="font-bold text-slate-700 dark:text-white text-sm">{{ profile.name }}</span>
          <span class="text-xs text-indigo-500 font-semibold">Level {{ profile.level }}</span>
        </button>

        <!-- Add profile button -->
        <button
          class="flex flex-col items-center gap-2 p-4 bg-indigo-50 dark:bg-slate-700 rounded-2xl shadow-md border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:scale-105 transition-all"
          @click="step = 'create'"
          aria-label="Neues Profil erstellen"
        >
          <div class="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
            <Plus class="w-8 h-8 text-indigo-500" />
          </div>
          <span class="font-bold text-indigo-500 text-sm">Neu</span>
        </button>
      </div>

      <button
        v-else
        class="px-8 py-4 bg-indigo-600 text-white rounded-full font-extrabold text-lg shadow-xl hover:bg-indigo-700 hover:scale-105 transition-all"
        @click="step = 'create'"
      >
        Profil erstellen
      </button>
    </div>

    <!-- Step 2: Create profile -->
    <div v-if="step === 'create'" class="flex-1 flex flex-col items-center justify-center p-6">
      <div class="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8">
        <button class="text-slate-400 mb-4 flex items-center gap-1 text-sm" @click="step = 'select'" aria-label="Zurück">
          <ChevronLeft class="w-4 h-4" /> Zurück
        </button>
        <h2 class="text-2xl font-extrabold text-slate-800 dark:text-white mb-6 text-center">Neues Profil</h2>

        <!-- Name input -->
        <div class="mb-6">
          <label for="profile-name" class="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Dein Name</label>
          <input
            id="profile-name"
            v-model="newName"
            type="text"
            maxlength="20"
            placeholder="z.B. Sophie"
            class="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 outline-none text-lg font-bold dark:bg-slate-700 dark:text-white"
            @keydown.enter="createProfile"
          />
        </div>

        <!-- Avatar selection -->
        <div class="mb-8">
          <p class="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">Wähle deinen Avatar</p>
          <div class="grid grid-cols-6 gap-2">
            <button
              v-for="(emoji, idx) in avatarEmojis"
              :key="idx"
              class="w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all border-2"
              :class="selectedAvatar === idx ? 'border-indigo-500 scale-110 shadow-lg bg-indigo-50' : 'border-transparent bg-slate-100 dark:bg-slate-700 hover:scale-110'"
              @click="selectedAvatar = idx"
              :aria-label="`Avatar ${idx + 1} auswählen`"
              :aria-pressed="selectedAvatar === idx"
            >
              {{ emoji }}
            </button>
          </div>
        </div>

        <!-- Preview -->
        <div class="flex items-center gap-4 mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl">
          <AvatarIcon :avatar-id="selectedAvatar" />
          <div>
            <p class="font-extrabold text-slate-800 dark:text-white text-lg">{{ newName || 'Dein Name' }}</p>
            <p class="text-sm text-indigo-500">Level 1 · 0 XP</p>
          </div>
        </div>

        <button
          class="w-full py-4 bg-indigo-600 text-white rounded-full font-extrabold text-lg shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!newName.trim() || creating"
          @click="createProfile"
        >
          <span v-if="creating">Erstelle Profil...</span>
          <span v-else>Los geht's!</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, ChevronLeft } from '@lucide/vue'
import { useUserStore } from '@/stores/userStore'
import { useFlagStore } from '@/stores/flagStore'
import AvatarIcon from '@/components/ui/AvatarIcon.vue'

const userStore = useUserStore()
const flagStore = useFlagStore()
const router = useRouter()

const step = ref<'select' | 'create'>(userStore.allProfiles.length === 0 ? 'create' : 'select')
const newName = ref('')
const selectedAvatar = ref(0)
const creating = ref(false)

const avatarEmojis = ['🦁', '🐯', '🐻', '🦊', '🐼', '🐸', '🦄', '🐬', '🦋', '🐉', '🦅', '🐙']

async function selectProfile(id: string) {
  await userStore.selectProfile(id)
  await flagStore.loadProgress()
  router.push({ name: 'home' })
}

async function createProfile() {
  if (!newName.value.trim() || creating.value) return
  creating.value = true
  try {
    const user = await userStore.createProfile(newName.value.trim(), selectedAvatar.value)
    await userStore.selectProfile(user.id)
    router.push({ name: 'home' })
  } finally {
    creating.value = false
  }
}
</script>
