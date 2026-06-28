<script setup lang="ts">
import { computed } from 'vue'
import { useUnionFind } from '@/composables/useUnionFind'
import { describeOperation } from '@/lib/captions'

const store = useUnionFind()

interface Row {
  index: number
  endStep: number
  startStep: number
  text: string
  kind: string
}

const rows = computed<Row[]>(() => {
  const ends = store.opBoundaries.value
  let start = 1
  return store.operations.value.map((op, i) => {
    const endStep = ends[i]
    const row: Row = {
      index: i,
      startStep: start,
      endStep,
      text: describeOperation(op),
      kind: op.kind,
    }
    start = endStep + 1
    return row
  })
})

const activeIndex = computed(() => {
  // the op whose step range contains the cursor
  const ends = store.opBoundaries.value
  for (let i = 0; i < ends.length; i++) {
    if (store.cursor.value <= ends[i]) return i
  }
  return ends.length - 1
})
</script>

<template>
  <section class="log" aria-label="Operation history">
    <header class="panel-head">
      <h2 class="eyebrow">History</h2>
    </header>
    <p v-if="rows.length === 0" class="empty">No operations yet. Merge a few sets to begin.</p>
    <ol v-else class="rows" role="list">
      <li v-for="row in [...rows].reverse()" :key="row.index">
        <button
          type="button"
          class="row"
          :class="{ 'is-active': row.index === activeIndex }"
          @click="store.seek(row.endStep)"
        >
          <span class="num">{{ row.index + 1 }}</span>
          <span class="desc">{{ row.text }}</span>
        </button>
      </li>
    </ol>
  </section>
</template>

<style scoped lang="scss">
.log {
  display: flex;
  flex-direction: column;
  background: var(--c-surface);
  border: var(--border-hairline);
  border-radius: var(--r-2);
  overflow: hidden;
}

.panel-head {
  padding: var(--space-3) var(--space-4);
  border-bottom: var(--border-hairline);
}

.empty {
  padding: var(--space-4);
  font-size: var(--fs--1);
  color: var(--c-faint);
}

.rows {
  list-style: none;
  margin: 0;
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 132px;
  overflow-y: auto;
}

.row {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  text-align: left;
  border-radius: var(--r-1);
  font-family: var(--font-mono);
  font-size: var(--fs--1);
  color: var(--c-ink);
  transition: background var(--dur-quick) var(--ease-quart);

  &:hover {
    background: var(--c-surface-2);
  }
  &.is-active {
    background: var(--c-accent-tint);
    color: var(--c-ink-strong);
  }

  .num {
    flex: 0 0 auto;
    color: var(--c-faint);
    min-width: 2ch;
    text-align: right;
  }

  .desc {
    min-width: 0;
    overflow-wrap: anywhere;
  }
}
</style>
