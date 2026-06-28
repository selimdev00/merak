<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUnionFind } from '@/composables/useUnionFind'
import { useInteraction } from '@/composables/useInteraction'

const store = useUnionFind()
const interaction = useInteraction()

const a = ref<number | null>(null)
const b = ref<number | null>(null)

const needsB = computed(() => interaction.mode.value !== 'find')
const actionLabel = computed(() => {
  switch (interaction.mode.value) {
    case 'union':
      return 'Union'
    case 'find':
      return 'Find'
    case 'connected':
      return 'Test'
  }
  return 'Run'
})
const max = computed(() => store.n.value - 1)

function run() {
  interaction.submitOperands(a.value ?? NaN, needsB.value ? (b.value ?? NaN) : null)
}
</script>

<template>
  <form class="operands" @submit.prevent="run">
    <div class="field">
      <label :for="'op-a'">a</label>
      <input
        id="op-a"
        v-model.number="a"
        type="number"
        min="0"
        :max="max"
        inputmode="numeric"
        placeholder="0"
      />
    </div>
    <div v-if="needsB" class="field">
      <label :for="'op-b'">b</label>
      <input
        id="op-b"
        v-model.number="b"
        type="number"
        min="0"
        :max="max"
        inputmode="numeric"
        placeholder="1"
      />
    </div>
    <button type="submit" class="btn btn--accent run">{{ actionLabel }}</button>
  </form>
  <p v-if="interaction.lastError.value" class="err" role="alert">{{ interaction.lastError.value }}</p>
</template>

<style scoped lang="scss">
.operands {
  display: flex;
  align-items: flex-end;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);

  label {
    font-family: var(--font-mono);
    font-size: var(--fs--1);
    color: var(--c-muted);
    padding-left: 2px;
  }

  input {
    width: 5.5ch;
    min-height: 44px;
    padding: 0 var(--space-2);
    text-align: center;
    font-family: var(--font-mono);
    font-size: var(--fs-0);
    color: var(--c-ink-strong);
    background: var(--c-surface);
    border: var(--border-hairline);
    border-radius: var(--r-2);
    transition: border-color var(--dur-quick) var(--ease-quart);

    &:hover {
      border-color: var(--c-hairline-2);
    }
    // strip spinners for a cleaner mono cell
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      appearance: none;
      margin: 0;
    }
    appearance: textfield;
  }
}

.run {
  flex: 0 0 auto;
}

.err {
  margin-top: var(--space-2);
  font-size: var(--fs--1);
  color: var(--c-neg);
}
</style>
