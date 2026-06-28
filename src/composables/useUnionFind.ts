import { computed, reactive, ref, shallowRef, triggerRef } from 'vue'
import { DSU } from '@/lib/dsu'
import type {
  Compression,
  Operation,
  Snapshot,
  Step,
  UFConfig,
  UnionStrategy,
} from '@/lib/types'
import { DEFAULT_N } from '@/lib/constants'

/**
 * Single-page store for the visualizer.
 *
 * Model: `engine` always holds the HEAD state (after every operation ever applied).
 * `operations` is the full ordered history. `cursor` is a pure VIEW pointer into a
 * flattened timeline of steps; moving it scrubs through history by restoring the
 * deep-copied snapshot each step carries. Rendering is a pure function of the
 * snapshot at the cursor, so step-back is just snapshot restoration (no inverse ops).
 */

export interface TimelineEntry {
  snapshot: Snapshot
  caption: string
  kind: string
  step: Step | null // null only for the synthetic initial entry
  opIndex: number // -1 for the initial entry
}

function initialCaption(n: number): string {
  return `${n} singletons. Each element is its own set. Pick a mode and start merging.`
}

function createStore() {
  const config = reactive<UFConfig>({
    unionStrategy: 'size',
    pathCompression: 'full',
  })

  const n = ref(DEFAULT_N)
  // shallowRef: the engine mutates its own arrays in place; we trigger explicitly.
  const engine = shallowRef(new DSU(n.value, { ...config }))
  const operations = shallowRef<Operation[]>([])
  const initialSnapshot = shallowRef<Snapshot>(engine.value.snapshot())

  const cursor = ref(0)

  /** Flattened timeline: index 0 is the initial state, then every step of every op. */
  const timeline = computed<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = [
      {
        snapshot: initialSnapshot.value,
        caption: initialCaption(n.value),
        kind: 'reset',
        step: null,
        opIndex: -1,
      },
    ]
    operations.value.forEach((op, opIndex) => {
      for (const step of op.steps) {
        entries.push({
          snapshot: step.snapshot,
          caption: step.caption,
          kind: step.kind,
          step,
          opIndex,
        })
      }
    })
    return entries
  })

  /** Timeline index where each operation ends (its last step). */
  const opEndIndex = computed<number[]>(() => {
    const ends: number[] = []
    let idx = 0
    for (const op of operations.value) {
      idx += op.steps.length
      ends.push(idx)
    }
    return ends
  })

  const totalSteps = computed(() => timeline.value.length - 1)
  const atEnd = computed(() => cursor.value >= totalSteps.value)
  const atStart = computed(() => cursor.value <= 0)

  const current = computed<TimelineEntry>(
    () => timeline.value[Math.min(cursor.value, timeline.value.length - 1)],
  )
  const viewSnapshot = computed<Snapshot>(() => current.value.snapshot)
  const activeStep = computed<Step | null>(() => current.value.step)
  const caption = computed(() => current.value.caption)

  // ---- Derived view state ----

  const parent = computed(() => viewSnapshot.value.parent)
  const componentCount = computed(() => viewSnapshot.value.count)

  function depthOf(p: number[], x: number): number {
    let d = 0
    let cur = x
    // guard against cycles (shouldn't happen)
    let guard = 0
    while (p[cur] !== cur && guard < p.length + 2) {
      cur = p[cur]
      d++
      guard++
    }
    return d
  }

  const maxHeight = computed(() => {
    const p = viewSnapshot.value.parent
    let max = 0
    for (let i = 0; i < p.length; i++) max = Math.max(max, depthOf(p, i))
    return max // in edges; tree of one node = 0
  })

  /** rootId for each node under the current view (for coloring). */
  const rootOf = computed<number[]>(() => {
    const p = viewSnapshot.value.parent
    const roots = new Array(p.length)
    for (let i = 0; i < p.length; i++) {
      let cur = i
      let guard = 0
      while (p[cur] !== cur && guard < p.length + 2) {
        cur = p[cur]
        guard++
      }
      roots[i] = cur
    }
    return roots
  })

  // ---- Session metrics (counted over operations completed by the cursor) ----

  const completedOpCount = computed(() => {
    const ends = opEndIndex.value
    let c = 0
    for (const end of ends) if (end <= cursor.value) c++
    return c
  })

  const metrics = computed(() => {
    const ends = opEndIndex.value
    let effectiveUnions = 0
    let noopUnions = 0
    let totalOps = 0
    let lastFindPathLength = 0
    operations.value.forEach((op, i) => {
      if (ends[i] > cursor.value) return // not yet reached
      totalOps++
      if (op.kind === 'union') {
        if (op.effective) effectiveUnions++
        else noopUnions++
      }
      if (op.kind === 'find') {
        let longest = 0
        for (const s of op.steps) if (s.path) longest = Math.max(longest, s.path.length - 1)
        lastFindPathLength = longest
      }
    })
    return {
      count: componentCount.value,
      totalOps,
      effectiveUnions,
      noopUnions,
      maxHeight: maxHeight.value,
      lastFindPathLength,
    }
  })

  // ---- Mutations (always applied at HEAD; cursor jumps to the new end) ----

  function pushOp(op: Operation) {
    operations.value = [...operations.value, op]
    triggerRef(engine)
    cursor.value = totalSteps.value
  }

  function union(a: number, b: number) {
    pushOp(engine.value.union(a, b))
  }
  function find(x: number) {
    pushOp(engine.value.find(x))
  }
  function connected(a: number, b: number): Operation {
    const op = engine.value.connected(a, b)
    pushOp(op)
    return op
  }
  function addElement() {
    const op = engine.value.makeSet()
    n.value = engine.value.parent.length
    pushOp(op)
  }

  function reset(newN: number = n.value) {
    n.value = newN
    engine.value = new DSU(newN, { ...config })
    initialSnapshot.value = engine.value.snapshot()
    operations.value = []
    cursor.value = 0
  }

  /** Restore the engine's HEAD arrays directly from a baked snapshot (avoids
   *  re-running ops, which would diverge when history contains config changes). */
  function restoreEngineTo(snap: Snapshot) {
    const fresh = new DSU(snap.parent.length, { ...config })
    fresh.parent = snap.parent.slice()
    fresh.size = snap.size.slice()
    fresh.rank = snap.rank.slice()
    fresh.count = snap.count
    engine.value = fresh
  }

  function lastSnapshot(ops: Operation[]): Snapshot | null {
    const last = ops[ops.length - 1]
    if (!last) return null
    const step = last.steps[last.steps.length - 1]
    return step ? step.snapshot : last.snapshotBefore
  }

  function loadHistory(newN: number, ops: Operation[]) {
    n.value = newN
    const base = new DSU(newN, { ...config })
    initialSnapshot.value = base.snapshot()
    const head = ops.length ? lastSnapshot(ops) : initialSnapshot.value
    restoreEngineTo(head ?? initialSnapshot.value)
    operations.value = ops
    cursor.value = 0
  }

  function undo() {
    if (operations.value.length === 0) return
    const ops = operations.value.slice(0, -1)
    const head = ops.length ? lastSnapshot(ops) : initialSnapshot.value
    restoreEngineTo(head ?? initialSnapshot.value)
    operations.value = ops
    cursor.value = Math.min(cursor.value, totalSteps.value)
  }

  function setStrategy(s: UnionStrategy) {
    config.unionStrategy = s
    engine.value.setConfig({ unionStrategy: s })
  }
  function setCompression(c: Compression) {
    config.pathCompression = c
    engine.value.setConfig({ pathCompression: c })
  }

  // ---- Cursor / playback control ----

  function seek(i: number) {
    cursor.value = Math.max(0, Math.min(i, totalSteps.value))
  }
  function stepForward() {
    if (!atEnd.value) cursor.value++
  }
  function stepBack() {
    if (!atStart.value) cursor.value--
  }

  /** Timeline indices at operation boundaries (for the scrubber chevrons). */
  const opBoundaries = computed(() => opEndIndex.value.slice())

  return {
    // config + size
    config,
    n,
    // history + cursor
    operations,
    timeline,
    cursor,
    totalSteps,
    atEnd,
    atStart,
    opBoundaries,
    completedOpCount,
    // view
    current,
    viewSnapshot,
    activeStep,
    caption,
    parent,
    rootOf,
    componentCount,
    maxHeight,
    metrics,
    // mutations
    union,
    find,
    connected,
    addElement,
    reset,
    loadHistory,
    undo,
    setStrategy,
    setCompression,
    // cursor control
    seek,
    stepForward,
    stepBack,
  }
}

export type UnionFindStore = ReturnType<typeof createStore>

let store: UnionFindStore | null = null

export function useUnionFind(): UnionFindStore {
  if (!store) store = createStore()
  return store
}
