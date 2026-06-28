<script setup lang="ts">
import { computed } from 'vue'

// One grout vein: a gently curved stroke running child -> parent (arrow toward parent).
const props = defineProps<{
  x1: number // child
  y1: number
  x2: number // parent
  y2: number
  vein: string
  dim?: boolean // de-emphasized (not in the active component)
  pulse?: boolean // no-op / already-connected feedback
}>()

const NODE_R = 22

const d = computed(() => {
  const { x1, y1, x2, y2 } = props
  // shorten both ends so the vein meets the chip rims, not their centers
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const sx = x1 + ux * (NODE_R - 2)
  const sy = y1 + uy * (NODE_R - 2)
  const ex = x2 - ux * (NODE_R + 4) // leave room for the arrowhead
  const ey = y2 - uy * (NODE_R + 4)
  // gentle perpendicular sag for a hand-poured grout feel
  const mx = (sx + ex) / 2
  const my = (sy + ey) / 2
  const sag = 9
  const cx = mx + -uy * sag
  const cy = my + ux * sag
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${ex.toFixed(2)} ${ey.toFixed(2)}`
})
</script>

<template>
  <path
    class="vein"
    :class="{ 'is-dim': dim, 'is-pulse': pulse }"
    :d="d"
    :stroke="vein"
    fill="none"
    pathLength="1"
    marker-end="url(#vein-arrow)"
  />
</template>

<style scoped lang="scss">
.vein {
  stroke-width: 2.25;
  stroke-linecap: round;
  transition:
    opacity var(--dur-base) var(--ease-quart),
    stroke var(--dur-base) var(--ease-quart);

  &.is-dim {
    opacity: 0.32;
  }

  &.is-pulse {
    animation: vein-pulse 620ms var(--ease-quart);
  }
}

@keyframes vein-pulse {
  0%,
  100% {
    opacity: 1;
  }
  40% {
    opacity: 0.25;
  }
}
</style>
