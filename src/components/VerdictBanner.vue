<script setup lang="ts">
import { useInteraction } from '@/composables/useInteraction'

const interaction = useInteraction()
</script>

<template>
  <Transition name="verdict">
    <div
      v-if="interaction.verdict.value"
      class="verdict"
      :class="interaction.verdict.value.connected ? 'is-yes' : 'is-no'"
      role="status"
    >
      <span class="dot" aria-hidden="true"></span>
      <p class="text">
        <strong>{{ interaction.verdict.value.connected ? 'Connected' : 'Not connected' }}.</strong>
        <span>
          {{ interaction.verdict.value.a }} sits under root
          {{ interaction.verdict.value.rootA }},
          {{ interaction.verdict.value.b }} under root
          {{ interaction.verdict.value.rootB }}.
        </span>
      </p>
      <button type="button" class="dismiss" aria-label="Dismiss" @click="interaction.clearVerdict()">
        &times;
      </button>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.verdict {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: var(--border-hairline);
  border-radius: var(--r-2);
  font-size: var(--fs-0);
}

.is-yes {
  background: var(--c-pos-tint);
  border-color: color-mix(in oklch, var(--c-pos) 40%, transparent);
  .dot {
    background: var(--c-pos);
  }
}
.is-no {
  background: var(--c-warn-tint);
  border-color: color-mix(in oklch, var(--c-warn) 40%, transparent);
  .dot {
    background: var(--c-warn);
  }
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: var(--r-pill);
  flex: 0 0 auto;
}

.text {
  flex: 1;
  color: var(--c-ink);
  strong {
    color: var(--c-ink-strong);
  }
  span {
    color: var(--c-muted);
  }
}

.dismiss {
  font-size: var(--fs-1);
  color: var(--c-muted);
  line-height: 1;
  padding: var(--space-1);
  &:hover {
    color: var(--c-ink);
  }
}

.verdict-enter-active,
.verdict-leave-active {
  transition:
    opacity var(--dur-quick) var(--ease-quart),
    transform var(--dur-quick) var(--ease-quart);
}
.verdict-enter-from,
.verdict-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
