import { computed, type Ref } from 'vue'
import { layoutForest } from '@/lib/layout'
import type { ForestLayout } from '@/lib/types'

/**
 * Memoized forest geometry. Recomputes only when the parent array (structure) or
 * the available width changes. The SVG uses a viewBox so absolute pixel scale is
 * arbitrary; width feeds the shelf packer's wrap point.
 */
export function useForestLayout(parent: Ref<number[]>, availableWidth: Ref<number>) {
  const layout = computed<ForestLayout>(() => layoutForest(parent.value, availableWidth.value))
  return { layout }
}
