<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useUnionFind } from '@/composables/useUnionFind'
import { useInteraction } from '@/composables/useInteraction'
import { useForestLayout } from '@/composables/useForestLayout'
import { chipSlot } from '@/lib/constants'
import ForestDefs from './ForestDefs.vue'
import ElementNode, { type Highlight } from './ElementNode.vue'
import TreeEdge from './TreeEdge.vue'

const store = useUnionFind()
const interaction = useInteraction()

const wrap = ref<HTMLElement | null>(null)
const availableWidth = ref(900)
let ro: ResizeObserver | null = null

onMounted(() => {
  if (wrap.value) {
    ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w && w > 0) availableWidth.value = Math.max(320, w)
    })
    ro.observe(wrap.value)
    availableWidth.value = Math.max(320, wrap.value.clientWidth || 900)
  }
  // seed positions without a tween
  for (const [id, node] of layout.value.nodes) display.value[id] = { x: node.x, y: node.y }
})
onUnmounted(() => ro?.disconnect())

const { layout } = useForestLayout(store.parent, availableWidth)

// ---- position tween: chips + veins move together ----
const display = ref<Record<number, { x: number; y: number }>>({})
let rafId = 0

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function reducedMotion(): boolean {
  const el = document.documentElement
  return (
    el.getAttribute('data-motion') === 'reduced' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function tweenTo() {
  const targets = layout.value.nodes
  const start: Record<number, { x: number; y: number }> = {}
  for (const [id, node] of targets) {
    start[id] = display.value[id] ? { ...display.value[id] } : { x: node.x, y: node.y }
  }
  // drop stale ids
  for (const k of Object.keys(display.value)) {
    if (!targets.has(Number(k))) delete display.value[Number(k)]
  }
  if (reducedMotion()) {
    const snap: Record<number, { x: number; y: number }> = {}
    for (const [id, node] of targets) snap[id] = { x: node.x, y: node.y }
    display.value = snap
    return
  }
  if (rafId) cancelAnimationFrame(rafId)
  const dur = 520
  let t0 = 0
  const tick = (t: number) => {
    if (!t0) t0 = t
    const p = easeOutExpo(Math.min(1, (t - t0) / dur))
    const next: Record<number, { x: number; y: number }> = {}
    for (const [id, node] of targets) {
      const s = start[id] ?? { x: node.x, y: node.y }
      next[id] = { x: s.x + (node.x - s.x) * p, y: s.y + (node.y - s.y) * p }
    }
    display.value = next
    if (p < 1) rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}

// retween only when the structure (parent content) or layout width changes
const structureKey = computed(() => store.parent.value.join(',') + '|' + availableWidth.value)
watch(structureKey, () => tweenTo())
onUnmounted(() => rafId && cancelAnimationFrame(rafId))

// ---- derived render data ----
const componentSize = computed(() => {
  const roots = store.rootOf.value
  const sizes: Record<number, number> = {}
  for (const r of roots) sizes[r] = (sizes[r] ?? 0) + 1
  return sizes
})

const highlights = computed<Record<number, Highlight>>(() => {
  const step = store.activeStep.value
  const map: Record<number, Highlight> = {}
  if (!step) return map
  switch (step.kind) {
    case 'find-visit':
      if (step.path) for (const p of step.path) map[p] = 'path'
      if (step.node !== undefined) map[step.node] = 'current'
      break
    case 'find-root':
      if (step.path) for (const p of step.path) map[p] = 'path'
      if (step.node !== undefined) map[step.node] = 'current'
      if (step.a !== undefined) map[step.a] = map[step.a] ?? 'path'
      if (step.b !== undefined) map[step.b] = map[step.b] ?? 'path'
      break
    case 'compress':
      if (step.path) for (const p of step.path) map[p] = 'moved'
      if (step.to !== undefined) map[step.to] = 'current'
      break
    case 'link':
      if (step.node !== undefined) map[step.node] = 'linked'
      if (step.to !== undefined) map[step.to] = 'linked'
      break
    case 'noop-connected':
      if (step.a !== undefined) map[step.a] = 'warn'
      if (step.b !== undefined) map[step.b] = 'warn'
      break
    case 'self':
      if (step.node !== undefined) map[step.node] = 'warn'
      break
  }
  return map
})

interface NodeView {
  id: number
  x: number
  y: number
  fill: string
  vein: string
  isRoot: boolean
  isSingleton: boolean
  depth: number
  parent: number
  highlight: Highlight
  picked: boolean
}

const nodes = computed<NodeView[]>(() => {
  const p = store.viewSnapshot.value.parent
  const roots = store.rootOf.value
  const sizes = componentSize.value
  const out: NodeView[] = []
  for (let id = 0; id < p.length; id++) {
    const ln = layout.value.nodes.get(id)
    const pos = display.value[id] ?? { x: ln?.x ?? 0, y: ln?.y ?? 0 }
    const root = roots[id]
    const isRoot = p[id] === id
    const isSingleton = isRoot && (sizes[root] ?? 1) === 1
    const slot = chipSlot(root)
    out.push({
      id,
      x: pos.x,
      y: pos.y,
      fill: isSingleton ? 'var(--chip-singleton)' : `var(--chip-${slot})`,
      vein: isSingleton ? 'var(--chip-singleton-vein)' : `var(--chip-${slot}-vein)`,
      isRoot,
      isSingleton,
      depth: ln?.depth ?? 0,
      parent: p[id],
      highlight: highlights.value[id] ?? 'none',
      picked: interaction.firstPick.value === id,
    })
  }
  return out
})

interface EdgeView {
  childId: number
  x1: number
  y1: number
  x2: number
  y2: number
  vein: string
  pulse: boolean
}

const edges = computed<EdgeView[]>(() => {
  const p = store.viewSnapshot.value.parent
  const roots = store.rootOf.value
  const step = store.activeStep.value
  const pulseNoop = step?.kind === 'noop-connected'
  const out: EdgeView[] = []
  for (let id = 0; id < p.length; id++) {
    if (p[id] === id) continue
    const c = display.value[id]
    const par = display.value[p[id]]
    if (!c || !par) continue
    const slot = chipSlot(roots[id])
    out.push({
      childId: id,
      x1: c.x,
      y1: c.y,
      x2: par.x,
      y2: par.y,
      vein: `var(--chip-${slot}-vein)`,
      pulse: pulseNoop,
    })
  }
  return out
})

const viewBox = computed(() => {
  const pad = 18
  const w = Math.max(layout.value.width, availableWidth.value)
  const h = Math.max(layout.value.height, 200)
  return `${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}`
})


const a11ySummary = computed(() => {
  const c = store.componentCount.value
  return `Disjoint-set forest: ${store.n.value} elements in ${c} ${c === 1 ? 'set' : 'sets'}, tallest tree ${store.maxHeight.value} ${store.maxHeight.value === 1 ? 'level' : 'levels'} deep.`
})

function onActivate(id: number) {
  interaction.activate(id)
}
function onHover(id: number | null) {
  interaction.hoverNode.value = id
}

// keep display seeded if layout arrives after mount
watch(
  () => layout.value.nodes.size,
  (size) => {
    if (Object.keys(display.value).length === 0 && size > 0) {
      const seed: Record<number, { x: number; y: number }> = {}
      for (const [id, node] of layout.value.nodes) seed[id] = { x: node.x, y: node.y }
      display.value = seed
    }
  },
  { immediate: true },
)
</script>

<template>
  <div ref="wrap" class="forest-wrap">
    <p id="forest-summary" class="visually-hidden" aria-live="polite">{{ a11ySummary }}</p>
    <svg
      class="forest"
      :viewBox="viewBox"
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label="Disjoint-set forest"
      aria-describedby="forest-summary"
    >
      <ForestDefs />
      <TransitionGroup tag="g" name="vein" class="veins">
        <TreeEdge
          v-for="e in edges"
          :key="`e-${e.childId}`"
          :x1="e.x1"
          :y1="e.y1"
          :x2="e.x2"
          :y2="e.y2"
          :vein="e.vein"
          :pulse="e.pulse"
        />
      </TransitionGroup>
      <TransitionGroup tag="g" name="node" class="chips">
        <ElementNode
          v-for="node in nodes"
          :key="`n-${node.id}`"
          v-bind="node"
          @activate="onActivate"
          @hover="onHover"
        />
      </TransitionGroup>
    </svg>
  </div>
</template>

<style scoped lang="scss">
.forest-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 280px;
  background: var(--c-bg-sunk);
  border: var(--border-hairline);
  border-radius: var(--r-3);
  overflow: hidden;
  // faint terrazzo speckle in the binder
  background-image:
    radial-gradient(circle at 18% 28%, oklch(0.5 0.02 76 / 0.05) 0 1.5px, transparent 2px),
    radial-gradient(circle at 64% 62%, oklch(0.5 0.02 76 / 0.045) 0 1.5px, transparent 2px),
    radial-gradient(circle at 82% 22%, oklch(0.5 0.02 76 / 0.04) 0 1.5px, transparent 2px),
    radial-gradient(circle at 40% 84%, oklch(0.5 0.02 76 / 0.05) 0 1.5px, transparent 2px);
  background-size:
    180px 180px,
    220px 220px,
    260px 260px,
    200px 200px;
}

.forest {
  display: block;
  width: 100%;
  height: 100%;
}

// node enter/leave
.node-enter-active {
  transition:
    opacity var(--dur-base) var(--ease-expo),
    transform var(--dur-base) var(--ease-expo);
}
.node-leave-active {
  transition: opacity var(--dur-quick) var(--ease-quart);
  position: absolute;
}
.node-enter-from {
  opacity: 0;
}
.node-leave-to {
  opacity: 0;
}

// vein draw-on
.vein-enter-active {
  transition:
    stroke-dashoffset var(--dur-slow) var(--ease-expo),
    opacity var(--dur-base) var(--ease-quart);
}
.vein-enter-from {
  opacity: 0;
}
.vein-enter-active .vein,
.vein-enter-from .vein {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}
.vein-leave-active {
  transition: opacity var(--dur-quick) var(--ease-quart);
}
.vein-leave-to {
  opacity: 0;
}
</style>
