<script setup lang="ts">
import { useUnionFind } from '@/composables/useUnionFind'
import { useInteraction } from '@/composables/useInteraction'
import ModeSelector from './ModeSelector.vue'
import OperandInputs from './OperandInputs.vue'
import OptionToggles from './OptionToggles.vue'
import ElementCountStepper from './ElementCountStepper.vue'
import VerdictBanner from './VerdictBanner.vue'

const store = useUnionFind()
const interaction = useInteraction()

function randomize() {
  interaction.clearPending()
  interaction.clearVerdict()
  store.reset(store.n.value)
  const n = store.n.value
  const rounds = Math.floor(n / 2)
  for (let i = 0; i < rounds; i++) {
    const a = Math.floor(Math.random() * n)
    let b = Math.floor(Math.random() * n)
    if (a === b) b = (b + 1) % n
    store.union(a, b)
  }
  store.seek(store.totalSteps.value)
}

function resetAll() {
  interaction.clearPending()
  interaction.clearVerdict()
  store.reset(store.n.value)
}
</script>

<template>
  <section class="control-panel" aria-label="Controls">
    <div class="block">
      <h2 class="eyebrow">Operation</h2>
      <ModeSelector />
      <OperandInputs />
    </div>

    <VerdictBanner />

    <div class="block">
      <h2 class="eyebrow">Strategy</h2>
      <OptionToggles />
    </div>

    <div class="block">
      <h2 class="eyebrow">Forest</h2>
      <ElementCountStepper />
      <div class="actions">
        <button type="button" class="btn" @click="randomize">Randomize</button>
        <button
          type="button"
          class="btn"
          :disabled="store.operations.value.length === 0"
          @click="store.undo()"
        >
          Undo
        </button>
        <button type="button" class="btn" @click="resetAll">Reset</button>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.control-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.block {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--c-surface);
  border: var(--border-hairline);
  border-radius: var(--r-2);
}

.actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;

  .btn {
    flex: 1 1 auto;
  }
}
</style>
