<script setup lang="ts">
import { ref } from 'vue'
import { useUnionFind } from '@/composables/useUnionFind'

const store = useUnionFind()
const introOpen = ref(true)
</script>

<template>
  <section class="caption" aria-label="Step narration">
    <p class="now" aria-live="polite" aria-atomic="true">{{ store.caption.value }}</p>

    <details class="intro" :open="introOpen" @toggle="introOpen = ($event.target as HTMLDetailsElement).open">
      <summary class="eyebrow">What am I looking at?</summary>
      <div class="intro-body">
        <p>
          <strong>Union-Find</strong> tracks a collection of disjoint sets. Each element points
          at a parent; follow the pointers up and you reach the set's <em>root</em>, the chip
          wearing the teal ring. Two elements are in the same set when they share a root.
        </p>
        <p>
          <strong>Union by size</strong> always hangs the smaller tree under the larger root, so
          trees stay shallow. <strong>Path compression</strong> re-points nodes straight at the
          root during a <code>find</code>, flattening long chains. Together they make lookups run
          in near-constant amortized time, <code>O(&alpha;(n))</code>, where &alpha; is the
          inverse Ackermann function and is at most 4 for any practical input.
        </p>
      </div>
    </details>
  </section>
</template>

<style scoped lang="scss">
.caption {
  padding: var(--space-4);
  background: var(--c-surface);
  border: var(--border-hairline);
  border-radius: var(--r-2);
}

.now {
  font-family: var(--font-mono);
  font-size: var(--fs-0);
  line-height: var(--lh-snug);
  color: var(--c-ink-strong);
  min-height: 2.6em;
  margin-bottom: var(--space-3);
}

.intro {
  border-top: var(--border-hairline);
  padding-top: var(--space-3);

  summary {
    cursor: pointer;
    list-style: revert;
    user-select: none;
  }

  &[open] summary {
    margin-bottom: var(--space-3);
  }
}

.intro-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: var(--measure);
  font-size: var(--fs--1);
  color: var(--c-muted);
  line-height: var(--lh-body);

  strong {
    color: var(--c-ink);
    font-weight: var(--fw-semi);
  }
  code {
    color: var(--c-ink);
  }
}
</style>
