<script setup lang="ts">
import { computed } from 'vue'

export type Highlight = 'none' | 'current' | 'path' | 'warn' | 'moved' | 'linked'

const props = defineProps<{
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
}>()

const emit = defineEmits<{
  (e: 'activate', id: number): void
  (e: 'hover', id: number | null): void
}>()

const NODE_R = 22

// One superellipse (squircle) path, generated once and reused for every chip.
const SQUIRCLE = (() => {
  const r = NODE_R
  const n = 4
  const steps = 64
  const pts: string[] = []
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * 2 * Math.PI
    const ct = Math.cos(t)
    const st = Math.sin(t)
    const x = Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n) * r
    const y = Math.sign(st) * Math.pow(Math.abs(st), 2 / n) * r
    pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return `M ${pts[0]} L ${pts.slice(1).join(' L ')} Z`
})()

const showRing = computed(() => props.isRoot && !props.isSingleton)

const ariaLabel = computed(() => {
  const role = props.isSingleton
    ? 'a singleton (its own set)'
    : props.isRoot
      ? 'the root of its set'
      : `child of ${props.parent}`
  return `Element ${props.id}, ${role}`
})

function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    emit('activate', props.id)
  }
}
</script>

<template>
  <g
    class="node"
    :class="[`hl-${highlight}`, { 'is-picked': picked, 'is-singleton': isSingleton }]"
    :style="{ transform: `translate(${x}px, ${y}px)`, '--depth': depth }"
    tabindex="0"
    role="button"
    :aria-label="ariaLabel"
    @click="emit('activate', id)"
    @keydown="onKey"
    @mouseenter="emit('hover', id)"
    @mouseleave="emit('hover', null)"
    @focus="emit('hover', id)"
    @blur="emit('hover', null)"
  >
    <!-- root inlay ring (the one place accent touches the data layer) -->
    <circle v-if="showRing" class="ring" :r="NODE_R + 5" />

    <!-- highlight halo for find/compress/no-op feedback -->
    <circle class="halo" :r="NODE_R + 9" />

    <!-- focus ring -->
    <circle class="focus" :r="NODE_R + 5" />

    <!-- the polished chip -->
    <path class="chip" :d="SQUIRCLE" :fill="fill" />
    <path class="chip-incise" :d="SQUIRCLE" :stroke="vein" fill="none" />

    <!-- engraved id -->
    <text class="label" text-anchor="middle" dominant-baseline="central">{{ id }}</text>

    <!-- generous transparent hit target (>=44px) -->
    <circle class="hit" :r="24" fill="transparent" />
  </g>
</template>

<style scoped lang="scss">
.node {
  cursor: pointer;
  // fill crossfade with a per-depth stagger -> the recolor ripple
  transition: none;

  .chip {
    transition: fill var(--dur-base) var(--ease-quart);
    transition-delay: calc(var(--depth) * var(--stagger-depth));
    filter: drop-shadow(0 1px 1.5px oklch(0.26 0.02 76 / 0.18));
  }

  .chip-incise {
    stroke-width: 1.25;
    opacity: 0.55;
    transition:
      stroke var(--dur-base) var(--ease-quart),
      opacity var(--dur-quick) var(--ease-quart);
    transition-delay: calc(var(--depth) * var(--stagger-depth));
  }

  .label {
    font-family: var(--font-mono);
    font-size: 16px;
    font-weight: 600;
    fill: var(--c-ink);
    pointer-events: none;
    user-select: none;
  }

  &:hover .chip {
    filter: drop-shadow(0 2px 5px oklch(0.26 0.02 76 / 0.28));
  }
}

.is-singleton {
  .label {
    fill: var(--c-muted);
  }
  .chip {
    filter: none;
  }
}

.ring {
  fill: none;
  stroke: var(--c-accent);
  stroke-width: 1.75;
  opacity: 0.9;
  transition: opacity var(--dur-base) var(--ease-quart);
}

.halo {
  fill: none;
  stroke-width: 3;
  opacity: 0;
  transition: opacity var(--dur-quick) var(--ease-quart);
}

.focus {
  fill: none;
  stroke: var(--c-accent);
  stroke-width: 2.5;
  opacity: 0;
}

.node:focus-visible {
  outline: none;
  .focus {
    opacity: 1;
  }
}

// ---- highlight states ----
.hl-current .halo {
  stroke: var(--c-accent);
  opacity: 1;
  animation: halo-pulse 700ms var(--ease-quart);
}
.hl-path .halo {
  stroke: var(--c-accent);
  opacity: 0.55;
}
.hl-warn .halo {
  stroke: var(--c-warn);
  opacity: 1;
  animation: halo-pulse 620ms var(--ease-quart);
}
.hl-moved .halo {
  stroke: var(--c-pos);
  opacity: 0.9;
  animation: halo-pulse 620ms var(--ease-quart);
}
.hl-linked .halo {
  stroke: var(--c-pos);
  opacity: 0.85;
}

.is-picked .chip {
  filter: drop-shadow(0 0 0 2px var(--c-accent)) drop-shadow(0 2px 6px oklch(0.26 0.02 76 / 0.3));
}
.is-picked .ring {
  opacity: 1;
}

@keyframes halo-pulse {
  0% {
    opacity: 0;
    transform: scale(0.82);
  }
  45% {
    opacity: 1;
  }
  100% {
    opacity: 0.55;
    transform: scale(1);
  }
}
</style>
