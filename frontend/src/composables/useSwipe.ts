import { ref, onMounted, onUnmounted } from 'vue'

export function useSwipe(
  onSwipeUp: () => void,
  onSwipeDown: () => void,
  threshold = 50
) {
  const touchStartY = ref(0)
  const isDragging = ref(false)
  const dragOffset = ref(0)

  function handleTouchStart(e: TouchEvent) {
    touchStartY.value = e.touches[0]?.clientY ?? 0
    isDragging.value = true
    dragOffset.value = 0
  }

  function handleTouchMove(e: TouchEvent) {
    if (!isDragging.value) return
    const currentY = e.touches[0]?.clientY ?? 0
    dragOffset.value = currentY - touchStartY.value
  }

  function handleTouchEnd(e: TouchEvent) {
    if (!isDragging.value) return
    isDragging.value = false
    const endY = e.changedTouches[0]?.clientY ?? 0
    const delta = endY - touchStartY.value
    dragOffset.value = 0
    if (Math.abs(delta) < threshold) return
    if (delta < 0) onSwipeUp()
    else onSwipeDown()
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowUp') onSwipeUp()
    if (e.key === 'ArrowDown') onSwipeDown()
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return { dragOffset, isDragging, handleTouchStart, handleTouchMove, handleTouchEnd }
}
