<script setup lang="ts">
import { computed } from 'vue'
import { useUnionFind } from '@/composables/useUnionFind'
import { usePlayback } from '@/composables/usePlayback'
import { SPEED_STEPS } from '@/lib/constants'

const store = useUnionFind()
const pb = usePlayback()

const max = computed(() => Math.max(1, store.totalSteps.value))
const markers = computed(() =>
  store.opBoundaries.value
    .filter((b) => b > 0 && b < store.totalSteps.value)
    .map((b) => ({ at: b, pct: (b / max.value) * 100 })),
)

function onScrub(e: Event) {
  pb.pause()
  store.seek(Number((e.target as HTMLInputElement).value))
}
function onSpeed(e: Event) {
  pb.setSpeed(Number((e.target as HTMLSelectElement).value))
}
</script>

<template>
  <div class="playback" role="group" aria-label="Playback">
    <div class="transport">
      <button type="button" class="btn btn--icon" aria-label="Restart" @click="pb.restart()">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <button
        type="button"
        class="btn btn--icon"
        aria-label="Step back"
        :disabled="store.atStart.value"
        @click="pb.stepBack()"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M8 5v14h2.4V5H8Zm8 0-7 7 7 7V5Z" fill="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        class="btn btn--accent btn--icon play"
        :aria-label="pb.playing.value ? 'Pause' : 'Play'"
        @click="pb.toggle()"
      >
        <svg v-if="!pb.playing.value" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M7 4.5v15l13-7.5-13-7.5Z" fill="currentColor" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M6.5 4.5h4v15h-4v-15Zm7 0h4v15h-4v-15Z" fill="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        class="btn btn--icon"
        aria-label="Step forward"
        :disabled="store.atEnd.value"
        @click="pb.stepForward()"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M16 5v14h-2.4V5H16ZM8 5l7 7-7 7V5Z" fill="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        class="btn btn--icon"
        aria-label="Skip to end of this operation"
        :disabled="store.atEnd.value"
        @click="pb.skipToOpEnd()"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M5 5l8 7-8 7V5Zm10 0h2.4v14H15V5Z" fill="currentColor" />
        </svg>
      </button>
    </div>

    <div class="scrub">
      <div class="track-wrap">
        <span
          v-for="m in markers"
          :key="m.at"
          class="marker"
          :style="{ left: `${m.pct}%` }"
          aria-hidden="true"
        ></span>
        <input
          class="range"
          type="range"
          min="0"
          :max="max"
          step="1"
          :value="store.cursor.value"
          :aria-label="`Timeline step ${store.cursor.value} of ${store.totalSteps.value}`"
          @input="onScrub"
        />
      </div>
      <span class="counter">{{ store.cursor.value }}/{{ store.totalSteps.value }}</span>
    </div>

    <label class="speed">
      <span class="visually-hidden">Playback speed</span>
      <select :value="pb.speed.value" aria-label="Playback speed" @change="onSpeed">
        <option v-for="s in SPEED_STEPS" :key="s" :value="s">{{ s }}&times;</option>
      </select>
    </label>
  </div>
</template>

<style scoped lang="scss">
.playback {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
  padding: var(--space-3) var(--space-4);
  background: var(--c-surface);
  border: var(--border-hairline);
  border-radius: var(--r-2);
}

.transport {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.play {
  min-width: 52px;
}

.scrub {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1 1 240px;
  min-width: 200px;
}

.track-wrap {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.marker {
  position: absolute;
  top: 50%;
  width: 2px;
  height: 12px;
  margin-top: -6px;
  background: var(--c-hairline-2);
  border-radius: 1px;
  pointer-events: none;
  z-index: 0;
}

.range {
  position: relative;
  z-index: 1;
  width: 100%;
  appearance: none;
  height: 4px;
  border-radius: var(--r-pill);
  background: var(--c-bg-sunk);
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: var(--r-pill);
    background: var(--c-accent);
    border: 2px solid var(--c-surface);
    box-shadow: var(--shadow-1);
  }
  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border: 2px solid var(--c-surface);
    border-radius: var(--r-pill);
    background: var(--c-accent);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
}

.counter {
  font-family: var(--font-mono);
  font-size: var(--fs--1);
  color: var(--c-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.speed select {
  min-height: 44px;
  padding: 0 var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--fs--1);
  color: var(--c-ink);
  background: var(--c-surface);
  border: var(--border-hairline);
  border-radius: var(--r-2);
  cursor: pointer;
}
</style>
