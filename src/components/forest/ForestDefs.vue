<script setup lang="ts">
// SVG <defs>: a single arrowhead marker that inherits each vein's stroke color
// via context-stroke, plus a soft drop for the root ring.
</script>

<template>
  <defs>
    <marker
      id="vein-arrow"
      viewBox="0 0 10 10"
      refX="8.5"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path d="M1 1 L9 5 L1 9 Z" fill="context-stroke" />
    </marker>
  </defs>
</template>
