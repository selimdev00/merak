<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUnionFind } from '@/composables/useUnionFind'
import { useInteraction } from '@/composables/useInteraction'
import { MAX_N, MIN_N } from '@/lib/constants'

const store = useUnionFind()
const interaction = useInteraction()

const draft = ref(store.n.value)
watch(
  () => store.n.value,
  (v) => (draft.value = v),
)

function clamp(v: number) {
  return Math.max(MIN_N, Math.min(MAX_N, Math.round(v || MIN_N)))
}
function applyReset(v: number) {
  const next = clamp(v)
  draft.value = next
  interaction.clearPending()
  interaction.clearVerdict()
  store.reset(next)
}
function bump(delta: number) {
  applyReset(draft.value + delta)
}
function addOne() {
  if (store.n.value >= MAX_N) return
  interaction.clearVerdict()
  store.addElement()
}
</script>

<template>
  <div class="stepper-group">
    <div class="stepper" role="group" aria-label="Number of elements">
      <button
        type="button"
        class="btn btn--icon"
        aria-label="Fewer elements"
        :disabled="draft <= MIN_N"
        @click="bump(-1)"
      >
        &minus;
      </button>
      <label class="count">
        <span class="visually-hidden">Element count (resets the forest)</span>
        <input
          v-model.number="draft"
          type="number"
          :min="MIN_N"
          :max="MAX_N"
          inputmode="numeric"
          @change="applyReset(draft)"
        />
      </label>
      <button
        type="button"
        class="btn btn--icon"
        aria-label="More elements"
        :disabled="draft >= MAX_N"
        @click="bump(1)"
      >
        +
      </button>
    </div>
    <button type="button" class="btn add" :disabled="store.n.value >= MAX_N" @click="addOne">
      Add element
    </button>
  </div>
</template>

<style scoped lang="scss">
.stepper-group {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  align-items: center;
}

.stepper {
  display: inline-flex;
  align-items: stretch;
  border: var(--border-hairline);
  border-radius: var(--r-2);
  overflow: hidden;
  background: var(--c-surface);

  .btn {
    border: none;
    border-radius: 0;
    font-size: var(--fs-1);
    background: transparent;
  }
}

.count input {
  width: 4ch;
  height: 100%;
  min-height: 44px;
  text-align: center;
  font-family: var(--font-mono);
  font-size: var(--fs-0);
  color: var(--c-ink-strong);
  background: var(--c-bg-sunk);
  border: none;
  border-left: var(--border-hairline);
  border-right: var(--border-hairline);

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }
  appearance: textfield;
}
</style>
