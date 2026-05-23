<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
    <!-- Header -->
    <header class="bg-white dark:bg-slate-800 shadow-sm px-4 py-3 flex items-center gap-3">
      <button
        class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        @click="router.push({ name: 'home' })"
        aria-label="Zurück"
      >
        <ChevronLeft class="w-5 h-5 text-slate-600 dark:text-slate-300" />
      </button>
      <h1 class="font-extrabold text-slate-800 dark:text-white">Was möchtest du lernen?</h1>
    </header>

    <div class="flex-1 flex flex-col justify-center p-6 gap-4">
      <!-- Länder & Flaggen -->
      <button
        class="w-full flex items-center gap-5 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.01] transition-all border-2 border-transparent hover:border-indigo-400"
        @click="router.push({ name: 'learn' })"
      >
        <div class="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
          <Globe class="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div class="text-left flex-1">
          <p class="font-extrabold text-slate-800 dark:text-white text-lg">Länder &amp; Flaggen</p>
          <p class="text-sm text-slate-500 mt-0.5">{{ flagStore.learnedCount }} gelernt · {{ flagStore.seenCount }} gesehen</p>
        </div>
        <ChevronRight class="w-5 h-5 text-slate-400 shrink-0" />
      </button>

      <!-- Flüsse der Welt -->
      <button
        class="w-full flex items-center gap-5 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.01] transition-all border-2 border-transparent hover:border-blue-400"
        @click="router.push({ name: 'learn-rivers' })"
      >
        <div class="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
          <Droplets class="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div class="text-left flex-1">
          <p class="font-extrabold text-slate-800 dark:text-white text-lg">Flüsse der Welt</p>
          <p class="text-sm text-slate-500 mt-0.5">{{ riverStore.learnedCount }} gelernt · {{ riverStore.seenCount }} gesehen</p>
        </div>
        <ChevronRight class="w-5 h-5 text-slate-400 shrink-0" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ChevronLeft, ChevronRight, Globe, Droplets } from '@lucide/vue'
import { useFlagStore } from '@/stores/flagStore'
import { useRiverStore } from '@/stores/riverStore'

const router = useRouter()
const flagStore = useFlagStore()
const riverStore = useRiverStore()
</script>
