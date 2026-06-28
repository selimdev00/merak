import { ref } from 'vue'
import { BASE_STEP_MS, DEFAULT_SPEED } from '@/lib/constants'
import { useUnionFind } from './useUnionFind'

/**
 * Transport over the store's step timeline. Uses a requestAnimationFrame clock
 * (not setInterval) so speed changes and pauses are frame-accurate and it pauses
 * cleanly when the tab is backgrounded. Shared singleton.
 */
function createPlayback() {
  const store = useUnionFind()
  const playing = ref(false)
  const speed = ref(DEFAULT_SPEED)

  let rafId = 0
  let lastT = 0
  let acc = 0

  function frame(t: number) {
    if (!playing.value) return
    if (lastT === 0) lastT = t
    const dt = t - lastT
    lastT = t
    acc += dt

    const stepMs = BASE_STEP_MS / speed.value
    while (acc >= stepMs) {
      acc -= stepMs
      if (store.atEnd.value) {
        pause()
        return
      }
      store.stepForward()
    }
    rafId = requestAnimationFrame(frame)
  }

  function play() {
    if (playing.value) return
    if (store.atEnd.value) store.seek(0)
    playing.value = true
    lastT = 0
    acc = 0
    rafId = requestAnimationFrame(frame)
  }

  function pause() {
    playing.value = false
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
  }

  function toggle() {
    playing.value ? pause() : play()
  }

  function setSpeed(s: number) {
    speed.value = s
  }

  function stepForward() {
    pause()
    store.stepForward()
  }
  function stepBack() {
    pause()
    store.stepBack()
  }
  function restart() {
    pause()
    store.seek(0)
  }
  function skipToOpEnd() {
    const ends = store.opBoundaries.value
    const c = store.cursor.value
    const next = ends.find((e) => e > c)
    store.seek(next ?? store.totalSteps.value)
  }

  return { playing, speed, play, pause, toggle, setSpeed, stepForward, stepBack, restart, skipToOpEnd }
}

export type PlaybackStore = ReturnType<typeof createPlayback>
let playback: PlaybackStore | null = null
export function usePlayback(): PlaybackStore {
  if (!playback) playback = createPlayback()
  return playback
}
