import { onMounted, onScopeDispose, ref } from 'vue'

/**
 * Tracks the OS `prefers-reduced-motion` setting plus a manual override toggle.
 * When reduced, sets `data-motion="reduced"` on <html> so the token layer zeros
 * out durations and staggers.
 */
const STORAGE_KEY = 'disjoint-motion'

export function useReducedMotion() {
  const systemReduced = ref(false)
  // null = follow system; true/false = manual override
  const override = ref<boolean | null>(readStored())

  let mql: MediaQueryList | null = null

  function readStored(): boolean | null {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      if (v === 'reduced') return true
      if (v === 'full') return false
    } catch {
      /* ignore */
    }
    return null
  }

  const reduced = () => (override.value === null ? systemReduced.value : override.value)

  function apply() {
    document.documentElement.toggleAttribute('data-motion', reduced())
    if (reduced()) document.documentElement.setAttribute('data-motion', 'reduced')
  }

  function setOverride(v: boolean | null) {
    override.value = v
    try {
      if (v === null) localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, v ? 'reduced' : 'full')
    } catch {
      /* ignore */
    }
    apply()
  }

  function toggle() {
    setOverride(!reduced())
  }

  onMounted(() => {
    mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    systemReduced.value = mql.matches
    const onChange = (e: MediaQueryListEvent) => {
      systemReduced.value = e.matches
      apply()
    }
    mql.addEventListener('change', onChange)
    apply()
    onScopeDispose(() => mql?.removeEventListener('change', onChange))
  })

  return { reduced, override, systemReduced, setOverride, toggle }
}
