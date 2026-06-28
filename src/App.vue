<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useUnionFind } from '@/composables/useUnionFind'
import { useInteraction } from '@/composables/useInteraction'
import { usePlayback } from '@/composables/usePlayback'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { buildDemo } from '@/lib/demo'
import { DEFAULT_N } from '@/lib/constants'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import StatsBar from '@/components/StatsBar.vue'
import TheForest from '@/components/forest/TheForest.vue'
import PlaybackBar from '@/components/PlaybackBar.vue'
import ControlPanel from '@/components/ControlPanel.vue'
import LiveCaption from '@/components/LiveCaption.vue'
import ParentTable from '@/components/ParentTable.vue'
import OperationLog from '@/components/OperationLog.vue'

type AppMode = 'demo' | 'free'

const store = useUnionFind()
const interaction = useInteraction()
const pb = usePlayback()
useReducedMotion()

const appMode = ref<AppMode>('demo')
const demo = buildDemo()

function loadDemo() {
  pb.pause()
  interaction.clearPending()
  interaction.clearVerdict()
  store.loadHistory(demo.n, demo.operations)
}
function goFree() {
  pb.pause()
  interaction.clearPending()
  interaction.clearVerdict()
  store.reset(DEFAULT_N)
}

watch(appMode, (m) => (m === 'demo' ? loadDemo() : goFree()))

function isTyping(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || el.isContentEditable
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    interaction.clearPending()
    interaction.clearVerdict()
    return
  }
  if (isTyping(e.target)) return
  if (e.key === ' ') {
    e.preventDefault()
    pb.toggle()
  } else if (e.key === 'ArrowRight') {
    pb.stepForward()
  } else if (e.key === 'ArrowLeft') {
    pb.stepBack()
  }
}

onMounted(() => {
  loadDemo()
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <a class="skip-link" href="#forest">Skip to visualization</a>

  <div class="page">
    <AppHeader v-model:app-mode="appMode" />

    <main class="layout">
      <div class="viz">
        <StatsBar />
        <div id="forest" class="forest-region" tabindex="-1">
          <TheForest />
        </div>
        <PlaybackBar />
        <LiveCaption />
      </div>

      <aside class="side">
        <ControlPanel />
      </aside>

      <div class="bottom">
        <ParentTable />
        <OperationLog />
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped lang="scss">
.page {
  max-width: 1320px;
  margin: 0 auto;
  padding: clamp(var(--space-4), 3vw, var(--space-7));
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.layout {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: minmax(0, 1fr) clamp(320px, 30%, 380px);
  grid-template-areas:
    'viz    side'
    'bottom bottom';
  align-items: stretch;
}

.viz {
  grid-area: viz;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.forest-region {
  flex: 1 1 auto;
  min-height: 280px;
  display: flex;

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
    border-radius: var(--r-3);
  }
}

.side {
  grid-area: side;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  min-width: 0;
}

.bottom {
  grid-area: bottom;
  display: grid;
  gap: var(--space-5);
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  align-items: start;
}

@media (max-width: 1023px) {
  .layout {
    grid-template-columns: 1fr;
    grid-template-areas:
      'viz'
      'side'
      'bottom';
  }
  .bottom {
    grid-template-columns: 1fr;
  }
}
</style>
