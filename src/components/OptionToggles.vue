<script setup lang="ts">
import { useUnionFind } from '@/composables/useUnionFind'
import { useReducedMotion } from '@/composables/useReducedMotion'
import type { Compression, UnionStrategy } from '@/lib/types'
import SegmentedControl from './SegmentedControl.vue'

const store = useUnionFind()
const motion = useReducedMotion()

const strategyOpts: { value: UnionStrategy; label: string; title: string }[] = [
  { value: 'size', label: 'By size', title: 'Hang the smaller tree under the larger root' },
  { value: 'rank', label: 'By rank', title: 'Hang the lower-rank tree under the higher' },
  { value: 'naive', label: 'Naive', title: 'Always hang a under b (grows tall chains)' },
]
const compressionOpts: { value: Compression; label: string; title: string }[] = [
  { value: 'full', label: 'Full', title: 'Re-point every node on the path straight at the root' },
  { value: 'halving', label: 'Halving', title: 'Point every node at its grandparent' },
  { value: 'off', label: 'Off', title: 'No compression (let chains grow)' },
]
</script>

<template>
  <div class="toggles">
    <div class="toggle-row">
      <span class="eyebrow">Union</span>
      <SegmentedControl
        :model-value="store.config.unionStrategy"
        :options="strategyOpts"
        group-label="Union strategy"
        @update:model-value="store.setStrategy($event as UnionStrategy)"
      />
    </div>
    <div class="toggle-row">
      <span class="eyebrow">Compression</span>
      <SegmentedControl
        :model-value="store.config.pathCompression"
        :options="compressionOpts"
        group-label="Path compression"
        @update:model-value="store.setCompression($event as Compression)"
      />
    </div>
    <p class="note">Changes apply to the next operations; history is never rewritten.</p>
    <label class="motion-toggle">
      <input
        type="checkbox"
        :checked="motion.reduced()"
        @change="motion.setOverride(($event.target as HTMLInputElement).checked)"
      />
      Reduce motion
    </label>
  </div>
</template>

<style scoped lang="scss">
.toggles {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.toggle-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.note {
  font-size: var(--fs--1);
  color: var(--c-faint);
}

.motion-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--fs--1);
  color: var(--c-muted);
  cursor: pointer;

  input {
    width: 16px;
    height: 16px;
    accent-color: var(--c-accent);
  }
}
</style>
