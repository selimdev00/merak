<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUnionFind } from '@/composables/useUnionFind'

const store = useUnionFind()

// flash green when the tallest tree gets shorter (compression / restructuring win)
const heightDropped = ref(false)
watch(
  () => store.metrics.value.maxHeight,
  (next, prev) => {
    if (prev !== undefined && next < prev) {
      heightDropped.value = true
      window.setTimeout(() => (heightDropped.value = false), 900)
    }
  },
)
</script>

<template>
  <dl class="stats" aria-label="Live metrics">
    <div class="stat stat--lead">
      <dt class="eyebrow">Sets</dt>
      <dd>{{ store.metrics.value.count }}</dd>
    </div>
    <div class="stat" :class="{ 'is-flash': heightDropped }">
      <dt class="eyebrow">Tallest</dt>
      <dd>{{ store.metrics.value.maxHeight }}<span class="unit">lvl</span></dd>
    </div>
    <div class="stat">
      <dt class="eyebrow">Ops</dt>
      <dd>{{ store.metrics.value.totalOps }}</dd>
    </div>
    <div class="stat">
      <dt class="eyebrow">Merges</dt>
      <dd>{{ store.metrics.value.effectiveUnions }}</dd>
    </div>
    <div class="stat">
      <dt class="eyebrow">No-ops</dt>
      <dd>{{ store.metrics.value.noopUnions }}</dd>
    </div>
    <div class="stat">
      <dt class="eyebrow">Last find</dt>
      <dd>{{ store.metrics.value.lastFindPathLength }}<span class="unit">hop</span></dd>
    </div>
  </dl>
</template>

<style scoped lang="scss">
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin: 0;
  background: var(--c-surface);
  border: var(--border-hairline);
  border-radius: var(--r-2);
  overflow: hidden;
}

.stat {
  flex: 1 1 auto;
  min-width: 84px;
  padding: var(--space-3) var(--space-4);
  border-right: var(--border-hairline);
  transition: background var(--dur-base) var(--ease-quart);

  &:last-child {
    border-right: none;
  }

  dt {
    margin-bottom: var(--space-1);
  }

  dd {
    margin: 0;
    font-family: var(--font-mono);
    font-size: var(--fs-1);
    font-weight: var(--fw-semi);
    color: var(--c-ink-strong);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
}

.stat--lead dd {
  font-size: var(--fs-3);
  color: var(--c-accent);
}

.unit {
  font-size: var(--fs--1);
  font-weight: var(--fw-reg);
  color: var(--c-muted);
  margin-left: 2px;
}

.is-flash {
  background: var(--c-pos-tint);
}
</style>
