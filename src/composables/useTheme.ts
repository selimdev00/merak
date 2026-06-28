import { onMounted, ref } from 'vue'

const STORAGE_KEY = 'disjoint-theme'
export type Theme = 'light' | 'dark'

export function useTheme() {
  const theme = ref<Theme>('light')

  function apply(t: Theme) {
    document.documentElement.setAttribute('data-theme', t)
    theme.value = t
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {
      /* ignore */
    }
  }

  function toggle() {
    apply(theme.value === 'light' ? 'dark' : 'light')
  }

  onMounted(() => {
    const current = (document.documentElement.getAttribute('data-theme') as Theme) || 'light'
    theme.value = current
  })

  return { theme, toggle, apply }
}
