<script setup lang="ts">
import { computed } from 'vue'
import { useUnionFind } from '@/composables/useUnionFind'
import { useInteraction } from '@/composables/useInteraction'
import { chipSlot } from '@/lib/constants'

const store = useUnionFind()
const interaction = useInteraction()

const ids = computed(() => store.viewSnapshot.value.parent.map((_, i) => i))
const snap = computed(() => store.viewSnapshot.value)
const showRank = computed(() => store.config.unionStrategy === 'rank')
const secondaryLabel = computed(() => (showRank.value ? 'rank' : 'size'))
const secondary = computed(() => (showRank.value ? snap.value.rank : snap.value.size))

function isRoot(i: number): boolean {
  return snap.value.parent[i] === i
}
function chipVar(i: number): string {
  return `var(--chip-${chipSlot(store.rootOf.value[i])}-vein)`
}
function colClass(i: number) {
  return {
    'is-root': isRoot(i),
    'is-hover': interaction.hoverNode.value === i,
  }
}
</script>

<template>
  <section class="table-panel" aria-label="State arrays">
    <header class="panel-head">
      <h2 class="eyebrow">State arrays</h2>
      <p class="hint">parent[i] points at i's parent; a root points at itself.</p>
    </header>
    <div class="scroll" role="region" aria-label="Parent and size arrays" tabindex="0">
      <table>
        <caption class="visually-hidden">
          For each element index, its parent pointer and {{ secondaryLabel }}.
        </caption>
        <thead>
          <tr>
            <th scope="col" class="row-label">i</th>
            <th
              v-for="i in ids"
              :key="i"
              scope="col"
              class="id-head"
              :class="colClass(i)"
              :style="{ '--rule': chipVar(i) }"
              @mouseenter="interaction.hoverNode.value = i"
              @mouseleave="interaction.hoverNode.value = null"
            >
              {{ i }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" class="row-label">parent</th>
            <td
              v-for="i in ids"
              :key="i"
              :class="colClass(i)"
              @mouseenter="interaction.hoverNode.value = i"
              @mouseleave="interaction.hoverNode.value = null"
            >
              {{ snap.parent[i] }}
            </td>
          </tr>
          <tr>
            <th scope="row" class="row-label">{{ secondaryLabel }}</th>
            <td
              v-for="i in ids"
              :key="i"
              :class="[colClass(i), { muted: !isRoot(i) && !showRank }]"
              @mouseenter="interaction.hoverNode.value = i"
              @mouseleave="interaction.hoverNode.value = null"
            >
              {{ secondary[i] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped lang="scss">
.table-panel {
  background: var(--c-surface);
  border: var(--border-hairline);
  border-radius: var(--r-2);
  overflow: hidden;
}

.panel-head {
  padding: var(--space-3) var(--space-4);
  border-bottom: var(--border-hairline);

  h2 {
    margin-bottom: 2px;
  }
  .hint {
    font-size: var(--fs--1);
    color: var(--c-muted);
  }
}

.scroll {
  overflow-x: auto;
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
}

table {
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: var(--fs--1);
  width: 100%;
  font-variant-numeric: tabular-nums;
}

th,
td {
  padding: var(--space-2) var(--space-3);
  text-align: center;
  min-width: 2.4ch;
  color: var(--c-ink);
  transition: background var(--dur-quick) var(--ease-quart);
}

.row-label {
  position: sticky;
  left: 0;
  z-index: 1;
  background: var(--c-surface-2);
  color: var(--c-muted);
  text-align: right;
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  font-size: 0.72rem;
  border-right: var(--border-hairline);
}

.id-head {
  color: var(--c-muted);
  font-weight: var(--fw-med);
  border-bottom: 2px solid var(--rule);
}

tbody tr:nth-child(even) td {
  background: var(--c-surface-2);
}

.is-root {
  color: var(--c-ink-strong);
  font-weight: var(--fw-semi);
}
td.is-root {
  box-shadow: inset 0 0 0 1.5px var(--c-accent-tint);
  border-radius: var(--r-1);
}

.muted {
  color: var(--c-faint);
}

.is-hover {
  background: var(--c-accent-tint) !important;
  color: var(--c-ink-strong);
}
</style>
