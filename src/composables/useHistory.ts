import { ref, computed } from 'vue'
import type { MemeProject } from '../types/meme'

const MAX_HISTORY = 30

export function useHistory() {
  const past = ref<MemeProject[]>([])
  const future = ref<MemeProject[]>([])

  function pushState(state: MemeProject) {
    past.value.push(JSON.parse(JSON.stringify(state)))
    if (past.value.length > MAX_HISTORY) {
      past.value.shift()
    }
    future.value = []
  }

  function undo(current: MemeProject): MemeProject | null {
    if (past.value.length === 0) return null
    future.value.push(JSON.parse(JSON.stringify(current)))
    return past.value.pop() ?? null
  }

  function redo(current: MemeProject): MemeProject | null {
    if (future.value.length === 0) return null
    past.value.push(JSON.parse(JSON.stringify(current)))
    return future.value.pop() ?? null
  }

  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  function clearHistory() {
    past.value = []
    future.value = []
  }

  return { past, future, pushState, undo, redo, canUndo, canRedo, clearHistory }
}
