<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import SegmentedControl from './SegmentedControl.vue'

type AppMode = 'demo' | 'free'

defineProps<{ appMode: AppMode }>()
const emit = defineEmits<{ (e: 'update:appMode', v: AppMode): void }>()

const { theme, toggle } = useTheme()

const modeOpts: { value: AppMode; label: string }[] = [
  { value: 'demo', label: 'Guided demo' },
  { value: 'free', label: 'Free play' },
]
</script>

<template>
  <header class="app-header">
    <div class="brand">
      <svg class="glyph" viewBox="0 0 64 64" width="40" height="40" aria-hidden="true">
        <circle cx="32" cy="15" r="11" fill="none" stroke="var(--c-accent)" stroke-width="2" />
        <circle cx="32" cy="15" r="8" fill="var(--chip-1)" />
        <path d="M16 44 Q20 30 29 19" stroke="var(--chip-2-vein)" stroke-width="2.4" fill="none" stroke-linecap="round" />
        <path d="M32 48 Q32 35 32 24" stroke="var(--chip-3-vein)" stroke-width="2.4" fill="none" stroke-linecap="round" />
        <path d="M48 44 Q44 31 35 20" stroke="var(--chip-1-vein)" stroke-width="2.4" fill="none" stroke-linecap="round" />
        <circle cx="16" cy="47" r="7" fill="var(--chip-2)" />
        <circle cx="32" cy="50" r="7" fill="var(--chip-3)" />
        <circle cx="48" cy="47" r="6" fill="var(--chip-1)" opacity="0.8" />
      </svg>
      <div class="title">
        <h1>Disjoint</h1>
        <p class="tagline">A Union-Find visualizer</p>
      </div>
    </div>

    <div class="tools">
      <SegmentedControl
        :model-value="appMode"
        :options="modeOpts"
        group-label="Application mode"
        @update:model-value="emit('update:appMode', $event as AppMode)"
      />
      <button
        type="button"
        class="btn btn--icon theme"
        :aria-label="theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'"
        @click="toggle"
      >
        <svg v-if="theme === 'light'" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" />
          </g>
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.glyph {
  flex: 0 0 auto;
}

.title h1 {
  font-size: var(--fs-4);
  line-height: 1;
  font-weight: var(--fw-bold);
}

.tagline {
  font-size: var(--fs--1);
  color: var(--c-muted);
  letter-spacing: 0.01em;
  margin-top: 2px;
}

.tools {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
</style>
