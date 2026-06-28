import { computed, ref } from 'vue'
import { useUnionFind } from './useUnionFind'

export type Mode = 'union' | 'find' | 'connected'

export interface Verdict {
  a: number
  b: number
  connected: boolean
  rootA: number
  rootB: number
}

function createInteraction() {
  const store = useUnionFind()

  const mode = ref<Mode>('union')
  const firstPick = ref<number | null>(null)
  const hoverNode = ref<number | null>(null)
  const verdict = ref<Verdict | null>(null)
  const lastError = ref<string | null>(null)

  const pendingLabel = computed(() => {
    if (firstPick.value === null) return null
    if (mode.value === 'union') return `Picked ${firstPick.value} — choose a second node to merge.`
    if (mode.value === 'connected') return `Picked ${firstPick.value} — choose a second node to test.`
    return null
  })

  function setMode(m: Mode) {
    mode.value = m
    firstPick.value = null
    lastError.value = null
  }

  function clearPending() {
    firstPick.value = null
  }

  function clearVerdict() {
    verdict.value = null
  }

  function valid(id: number): boolean {
    return Number.isInteger(id) && id >= 0 && id < store.n.value
  }

  /** A node was activated (click or keyboard). Drives the active mode. */
  function activate(id: number) {
    if (!valid(id)) return
    lastError.value = null
    verdict.value = null

    if (mode.value === 'find') {
      store.find(id)
      firstPick.value = null
      return
    }

    // union / connected need two picks
    if (firstPick.value === null) {
      firstPick.value = id
      return
    }
    const a = firstPick.value
    firstPick.value = null
    if (mode.value === 'union') {
      store.union(a, id)
    } else {
      const op = store.connected(a, id)
      verdict.value = {
        a,
        b: id,
        connected: op.result === true,
        rootA: op.rootA ?? a,
        rootB: op.rootB ?? id,
      }
    }
  }

  /** Numeric form submit: a + b (or just a for find). */
  function submitOperands(a: number, b: number | null) {
    if (!valid(a)) {
      lastError.value = `a must be between 0 and ${store.n.value - 1}`
      return
    }
    if (mode.value === 'find') {
      store.find(a)
      return
    }
    if (b === null || !valid(b)) {
      lastError.value = `b must be between 0 and ${store.n.value - 1}`
      return
    }
    verdict.value = null
    if (mode.value === 'union') {
      store.union(a, b)
    } else {
      const op = store.connected(a, b)
      verdict.value = {
        a,
        b,
        connected: op.result === true,
        rootA: op.rootA ?? a,
        rootB: op.rootB ?? b,
      }
    }
  }

  return {
    mode,
    firstPick,
    hoverNode,
    verdict,
    lastError,
    pendingLabel,
    setMode,
    clearPending,
    clearVerdict,
    activate,
    submitOperands,
  }
}

export type InteractionStore = ReturnType<typeof createInteraction>

let interaction: InteractionStore | null = null
export function useInteraction(): InteractionStore {
  if (!interaction) interaction = createInteraction()
  return interaction
}
