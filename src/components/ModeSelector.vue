<script setup lang="ts">
import { computed } from 'vue'
import { useInteraction, type Mode } from '@/composables/useInteraction'
import SegmentedControl from './SegmentedControl.vue'

const interaction = useInteraction()

const options: { value: Mode; label: string; title: string }[] = [
  { value: 'union', label: 'Union', title: 'Click two nodes to merge their sets' },
  { value: 'find', label: 'Find', title: 'Click one node to walk to its root' },
  { value: 'connected', label: 'Connected?', title: 'Click two nodes to test same-set' },
]

const helper = computed(() => {
  switch (interaction.mode.value) {
    case 'union':
      return 'Click a node, then another, to merge their sets.'
    case 'find':
      return 'Click a node to walk the pointers up to its root.'
    case 'connected':
      return 'Click two nodes to ask whether they share a root.'
  }
  return ''
})

function setMode(m: Mode) {
  interaction.setMode(m)
}
</script>

<template>
  <div class="mode">
    <SegmentedControl
      :model-value="interaction.mode.value"
      :options="options"
      group-label="Interaction mode"
      @update:model-value="setMode($event as Mode)"
    />
    <p class="helper">
      {{ interaction.pendingLabel.value || helper }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.mode {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.helper {
  font-size: var(--fs--1);
  color: var(--c-muted);
  min-height: 1.4em;
}
</style>
