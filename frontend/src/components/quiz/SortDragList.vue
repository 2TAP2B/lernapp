<template>
  <div class="flex flex-col gap-2 select-none">
    <div
      v-for="(item, idx) in localItems"
      :key="item.id"
      class="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 font-bold text-sm transition-all duration-150 touch-none"
      :class="[
        draggingId === item.id
          ? 'opacity-40 scale-95 border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 shadow',
        answered ? resultClass(item.id, idx) : '',
      ]"
      @mousedown="startDrag($event, idx)"
      @touchstart.prevent="startDrag($event, idx)"
    >
      <!-- Drag handle -->
      <div class="shrink-0 cursor-grab active:cursor-grabbing text-slate-400">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <rect x="3" y="4" width="14" height="2" rx="1"/>
          <rect x="3" y="9" width="14" height="2" rx="1"/>
          <rect x="3" y="14" width="14" height="2" rx="1"/>
        </svg>
      </div>
      <!-- Position number -->
      <span class="w-5 text-center text-xs font-extrabold text-slate-400 shrink-0">{{ idx + 1 }}</span>
      <!-- Label -->
      <span class="flex-1 text-slate-800 dark:text-white">{{ item.label }}</span>
      <!-- Result icon when answered -->
      <template v-if="answered">
        <span v-if="isCorrectPosition(item.id, idx)" class="text-green-500 font-extrabold text-lg">✓</span>
        <span v-else class="text-red-400 font-extrabold text-lg">✗</span>
      </template>
    </div>

    <!-- Drop indicator -->
    <div
      v-if="draggingId !== null"
      class="fixed inset-0 z-50 pointer-events-none"
      ref="ghostRef"
    >
      <div
        class="absolute px-4 py-3 rounded-2xl border-2 border-indigo-500 bg-indigo-100 dark:bg-indigo-900 shadow-2xl font-bold text-sm text-slate-800 dark:text-white opacity-90 min-w-[200px]"
        :style="ghostStyle"
      >
        {{ localItems.find(i => i.id === draggingId)?.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { SortItem } from '@/types'

const props = defineProps<{
  items: SortItem[]
  correctOrder?: string[]   // item IDs in correct order — only passed after answering
  answered?: boolean
}>()

const emit = defineEmits<{
  (e: 'update', order: string[]): void
}>()

const localItems = ref<SortItem[]>([...props.items])

watch(() => props.items, (v) => {
  localItems.value = [...v]
})

// ─── Drag state ──────────────────────────────────────────────────────────────
const draggingId = ref<string | null>(null)
const draggingFromIdx = ref(-1)
const ghostStyle = ref({ left: '0px', top: '0px', width: '200px' })
let startX = 0
let startY = 0
let itemHeight = 56 // estimate, updated on drag start
let containerTop = 0

function startDrag(e: MouseEvent | TouchEvent, idx: number) {
  if (props.answered) return
  const point = 'touches' in e ? e.touches[0]! : e
  startX = point.clientX
  startY = point.clientY
  draggingId.value = localItems.value[idx]!.id
  draggingFromIdx.value = idx

  // Measure item height from target element
  const target = (e.currentTarget as HTMLElement)
  itemHeight = target.offsetHeight + 8 // gap
  containerTop = target.getBoundingClientRect().top - idx * itemHeight

  ghostStyle.value = {
    left: `${point.clientX - 20}px`,
    top: `${point.clientY - 28}px`,
    width: `${target.offsetWidth}px`,
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onEnd)
  window.addEventListener('touchmove', onMove, { passive: false })
  window.addEventListener('touchend', onEnd)
}

function onMove(e: MouseEvent | TouchEvent) {
  if (draggingId.value === null) return
  if ('touches' in e) e.preventDefault()
  const point = 'touches' in e ? e.touches[0]! : e

  ghostStyle.value = {
    ...ghostStyle.value,
    left: `${point.clientX - 20}px`,
    top: `${point.clientY - 28}px`,
  }

  // Calculate target index based on Y position
  const relY = point.clientY - containerTop
  const targetIdx = Math.max(0, Math.min(localItems.value.length - 1, Math.round(relY / itemHeight)))

  if (targetIdx !== draggingFromIdx.value) {
    const items = [...localItems.value]
    const [moved] = items.splice(draggingFromIdx.value, 1)
    items.splice(targetIdx, 0, moved!)
    localItems.value = items
    draggingFromIdx.value = targetIdx
  }
}

function onEnd() {
  draggingId.value = null
  draggingFromIdx.value = -1
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', onEnd)
  window.removeEventListener('touchmove', onMove)
  window.removeEventListener('touchend', onEnd)
  emit('update', localItems.value.map(i => i.id))
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', onEnd)
  window.removeEventListener('touchmove', onMove)
  window.removeEventListener('touchend', onEnd)
})

// ─── Result helpers ──────────────────────────────────────────────────────────
function isCorrectPosition(itemId: string, idx: number): boolean {
  return props.correctOrder?.[idx] === itemId
}

function resultClass(itemId: string, idx: number): string {
  if (!props.answered) return ''
  return isCorrectPosition(itemId, idx)
    ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
    : 'border-red-400 bg-red-50 dark:bg-red-900/20'
}

// Expose current order for parent
const currentOrder = computed(() => localItems.value.map(i => i.id))
defineExpose({ currentOrder })
</script>
