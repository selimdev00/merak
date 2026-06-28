<script setup lang="ts">
interface Option {
  value: string
  label: string
  title?: string
}

defineProps<{
  modelValue: string
  options: Option[]
  groupLabel: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>

<template>
  <div class="segmented" role="radiogroup" :aria-label="groupLabel">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="radio"
      :aria-checked="modelValue === opt.value"
      :title="opt.title"
      class="seg"
      :class="{ 'is-on': modelValue === opt.value }"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.segmented {
  display: inline-flex;
  padding: 3px;
  background: var(--c-bg-sunk);
  border: var(--border-hairline);
  border-radius: var(--r-2);
  gap: 2px;
}

.seg {
  min-height: 38px;
  padding: 0 var(--space-3);
  font-size: var(--fs--1);
  font-weight: var(--fw-med);
  color: var(--c-muted);
  border-radius: calc(var(--r-2) - 3px);
  white-space: nowrap;
  transition:
    color var(--dur-quick) var(--ease-quart),
    background var(--dur-quick) var(--ease-quart),
    box-shadow var(--dur-quick) var(--ease-quart);

  &:hover:not(.is-on) {
    color: var(--c-ink);
  }

  &.is-on {
    color: var(--c-ink-strong);
    background: var(--c-surface);
    box-shadow: var(--shadow-1);
  }
}
</style>
