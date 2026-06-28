/**
 * layout.ts
 *
 * Deterministic forest-layout engine for the Union-Find / DSU visualizer.
 *
 * Pipeline (three phases):
 *   1. Per-tree: Reingold-Tilford-LITE subtree-width recursion → local (x, y)
 *      for every node (coordinates are relative to the tree's own origin).
 *   2. Per-tree: Derive a ComponentBox whose pixel dimensions tightly enclose
 *      all node circles (radius NODE_R) plus BOX_PAD on every side.
 *   3. Forest: Sort boxes (biggest first, ties by ascending rootId) then
 *      greedy-shelf-pack into rows that fit availableWidth. Finally offset
 *      every node's position by its box's packed origin.
 *
 * Pure and deterministic: identical (parent, availableWidth) → identical output.
 */

import type { LayoutNode, ComponentBox, ForestLayout } from './types'
import { NODE_R, NODE_GAP_X, LEVEL_GAP_Y, BOX_PAD, BOX_GUTTER } from './constants'

// ---------------------------------------------------------------------------
// Intermediate type — only used inside layoutForest, not exported.
// ---------------------------------------------------------------------------

/** Holds a ComponentBox together with the in-box node positions computed in
 *  Phase 1-2, kept alongside the box until Phase 4 can write final coords. */
type PendingBox = {
  box: ComponentBox
  /** nodeId → x coordinate relative to box top-left corner */
  nodeXInBox: Map<number, number>
  /** nodeId → y coordinate relative to box top-left corner */
  nodeYInBox: Map<number, number>
  /** nodeId → BFS depth (0 = root) */
  depths: Map<number, number>
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Returns a sorted (ascending) array of root ids.
 * A node i is a root iff parent[i] === i.
 *
 * @example
 *   rootsOf([0, 0, 1, 3, 3]) // → [0, 3]
 */
export function rootsOf(parent: number[]): number[] {
  const result: number[] = []
  for (let i = 0; i < parent.length; i++) {
    if (parent[i] === i) result.push(i)
  }
  // Iteration 0..n-1 already produces ascending order — no extra sort needed.
  return result
}

/**
 * Returns a Map of parent-id → children ids (each list sorted ascending).
 * Roots are not included as keys (they have no parent entry).
 *
 * @example
 *   childrenMap([0, 0, 1, 3, 3])
 *   // → Map { 0 → [1], 1 → [2], 3 → [4] }
 */
export function childrenMap(parent: number[]): Map<number, number[]> {
  const map = new Map<number, number[]>()
  for (let i = 0; i < parent.length; i++) {
    if (parent[i] !== i) {
      const p = parent[i]
      if (!map.has(p)) map.set(p, [])
      map.get(p)!.push(i) // safe: just set above
    }
  }
  // Sort ascending so the layout is deterministic across JS engines.
  for (const arr of map.values()) arr.sort((a, b) => a - b)
  return map
}

// ---------------------------------------------------------------------------
// Phase 1 helpers — tree-local layout (x from allocator, y from depth)
// ---------------------------------------------------------------------------

/**
 * POST-ORDER DFS: compute how many horizontal pixels each subtree needs.
 *
 *   - Leaf:           width = NODE_GAP_X
 *   - Internal node:  width = max(NODE_GAP_X, sum of children widths)
 *
 * Result is written into `widths` (passed in so the caller can read it).
 */
function computeSubtreeWidths(
  root: number,
  children: Map<number, number[]>,
  widths: Map<number, number>,
): void {
  function dfs(n: number): number {
    const ch = children.get(n) ?? []
    if (ch.length === 0) {
      widths.set(n, NODE_GAP_X)
      return NODE_GAP_X
    }
    let total = 0
    for (const c of ch) total += dfs(c)
    const w = Math.max(NODE_GAP_X, total)
    widths.set(n, w)
    return w
  }
  dfs(root)
}

/**
 * RECURSIVE X-ALLOCATOR.
 *
 * Each subtree occupies a horizontal band [leftEdge, leftEdge + subtreeWidth].
 *
 *   - Leaf:           center = leftEdge + width/2
 *   - Internal node:  recursively assign each child its own band left→right,
 *                     then center the parent over the span from first-child
 *                     center to last-child center.
 *
 * This guarantees:
 *   - No two sibling subtrees overlap.
 *   - Every parent is centered over its children.
 *   - The assignment is fully deterministic (children were sorted in childrenMap).
 */
function assignLocalX(
  node: number,
  leftEdge: number,
  children: Map<number, number[]>,
  widths: Map<number, number>,
  localX: Map<number, number>,
): void {
  const ch = children.get(node) ?? []

  if (ch.length === 0) {
    // Leaf: center within its allocated slot.
    localX.set(node, leftEdge + widths.get(node)! / 2)
    return
  }

  // Distribute the band among children left to right.
  let cursor = leftEdge
  for (const c of ch) {
    assignLocalX(c, cursor, children, widths, localX)
    cursor += widths.get(c)!
  }

  // Center this node over the horizontal span of its children's centers.
  const firstChildX = localX.get(ch[0])!
  const lastChildX = localX.get(ch[ch.length - 1])!
  localX.set(node, (firstChildX + lastChildX) / 2)
}

/**
 * BFS depth assignment from root (depth 0) downward.
 * Returns a Map<nodeId, depth>.
 */
function bfsDepths(root: number, children: Map<number, number[]>): Map<number, number> {
  const depths = new Map<number, number>()
  // Typed queue as a plain array used as a FIFO — small and cheap for n ≤ 50.
  const queue: Array<{ n: number; d: number }> = [{ n: root, d: 0 }]
  while (queue.length > 0) {
    const item = queue.shift()!
    depths.set(item.n, item.d)
    for (const c of children.get(item.n) ?? []) {
      queue.push({ n: c, d: item.d + 1 })
    }
  }
  return depths
}

/**
 * BFS-collect all node ids in a tree; returns them sorted ascending.
 */
function collectTree(root: number, children: Map<number, number[]>): number[] {
  const ids: number[] = []
  const queue = [root]
  while (queue.length > 0) {
    const n = queue.shift()!
    ids.push(n)
    for (const c of children.get(n) ?? []) queue.push(c)
  }
  return ids.sort((a, b) => a - b)
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Compute pixel positions for every node in the forest described by `parent`,
 * fitting the component boxes into rows of at most `availableWidth` pixels.
 *
 * See the module docstring for the full pipeline description.
 *
 * @param parent        DSU parent array: parent[i] is i's parent; i is a root iff parent[i]===i.
 * @param availableWidth Preferred max row width for shelf-packing. A single box
 *                       that exceeds it is still placed (never clipped).
 * @returns ForestLayout with absolute SVG-space coordinates for every node.
 */
export function layoutForest(parent: number[], availableWidth: number): ForestLayout {
  if (parent.length === 0) {
    return { nodes: new Map(), boxes: [], width: 0, height: 0 }
  }

  const roots = rootsOf(parent)
  const children = childrenMap(parent)

  // -------------------------------------------------------------------------
  // Phase 1 — compute tree-local positions (origin = top-left of subtree band)
  // -------------------------------------------------------------------------
  // localX[id]: x relative to the tree's leftmost allocation edge
  // localY[id]: y = depth * LEVEL_GAP_Y  (root is at y=0)
  //
  // We accumulate into flat maps across ALL trees; node ids are globally unique
  // so there is no collision.

  const localX = new Map<number, number>()
  const localY = new Map<number, number>()
  const depthsByRoot = new Map<number, Map<number, number>>()

  for (const root of roots) {
    // 1a. Post-order: subtree pixel widths.
    const widths = new Map<number, number>()
    computeSubtreeWidths(root, children, widths)

    // 1b. Recursive x-allocation starting at left edge = 0.
    assignLocalX(root, 0, children, widths, localX)

    // 1c. BFS: assign depth → y = depth * LEVEL_GAP_Y.
    const depths = bfsDepths(root, children)
    depthsByRoot.set(root, depths)
    for (const [id, d] of depths) {
      localY.set(id, d * LEVEL_GAP_Y)
    }
  }

  // -------------------------------------------------------------------------
  // Phase 2 — build ComponentBoxes
  // -------------------------------------------------------------------------
  // The box tightly encloses all node circles (radius NODE_R) with BOX_PAD on
  // every side.  We also compute each node's position relative to the box's
  // top-left corner so Phase 4 can apply the packed offset trivially.

  const pending: PendingBox[] = []

  for (const root of roots) {
    const nodeIds = collectTree(root, children) // sorted ascending
    const depths = depthsByRoot.get(root)!

    // Gather all local x / y values for this tree.
    const xs = nodeIds.map(id => localX.get(id)!)
    const ys = nodeIds.map(id => localY.get(id)!)

    // Bounding rectangle of node centers.
    const minCx = Math.min(...xs)
    const maxCx = Math.max(...xs)
    const minCy = Math.min(...ys) // always 0 (root)
    const maxCy = Math.max(...ys)

    // Expand by NODE_R to enclose full circles, then add BOX_PAD on each side.
    //
    //   innerL / innerR / innerT / innerB  — tight circle boundary
    //   boxW / boxH                        — total box pixel dimensions
    const innerL = minCx - NODE_R
    const innerR = maxCx + NODE_R
    const innerT = minCy - NODE_R
    const innerB = maxCy + NODE_R

    const boxW = (innerR - innerL) + 2 * BOX_PAD
    const boxH = (innerB - innerT) + 2 * BOX_PAD

    // Map each node to its (x, y) within this box, with origin at box top-left.
    //   nodeXInBox = localX - innerL + BOX_PAD
    //   nodeYInBox = localY - innerT + BOX_PAD
    const nodeXInBox = new Map<number, number>()
    const nodeYInBox = new Map<number, number>()
    for (const id of nodeIds) {
      nodeXInBox.set(id, localX.get(id)! - innerL + BOX_PAD)
      nodeYInBox.set(id, localY.get(id)! - innerT + BOX_PAD)
    }

    // max depth among this tree's nodes.
    let maxDepth = 0
    for (const d of depths.values()) {
      if (d > maxDepth) maxDepth = d
    }

    pending.push({
      box: {
        rootId: root,
        x: 0, // filled in during packing (Phase 3)
        y: 0,
        width: boxW,
        height: boxH,
        nodeIds,
        size: nodeIds.length,
        height_levels: maxDepth + 1, // 1 for singleton, 2 for two-level, …
      },
      nodeXInBox,
      nodeYInBox,
      depths,
    })
  }

  // -------------------------------------------------------------------------
  // Phase 3 — sort then shelf-pack
  // -------------------------------------------------------------------------
  // Sort: bigger components first (fewest wasted shelf-gaps); ties broken by
  // ascending rootId for a fully deterministic order.

  pending.sort((a, b) => {
    if (b.box.size !== a.box.size) return b.box.size - a.box.size
    return a.box.rootId - b.box.rootId
  })

  // Greedy left-to-right, top-to-bottom shelf packing.
  //
  // Rules:
  //   - Always place the first box of a row regardless of its width.
  //   - If the next box would push rowX + boxW past availableWidth AND we are
  //     not the first box in the current row, start a new row.
  //   - Rows are separated by BOX_GUTTER.

  let rowX = 0
  let rowY = 0
  let rowMaxH = 0
  let firstInRow = true

  for (const { box } of pending) {
    if (!firstInRow && rowX + box.width > availableWidth) {
      // Overflow — advance to next shelf.
      rowY += rowMaxH + BOX_GUTTER
      rowX = 0
      rowMaxH = 0
      firstInRow = true
    }

    box.x = rowX
    box.y = rowY

    rowX += box.width + BOX_GUTTER
    if (box.height > rowMaxH) rowMaxH = box.height
    firstInRow = false
  }

  // -------------------------------------------------------------------------
  // Phase 4 — build final LayoutNode map with absolute forest coordinates
  // -------------------------------------------------------------------------
  // Offset each node's in-box position by the box's packed (x, y) origin.

  const nodes = new Map<number, LayoutNode>()

  for (const { box, nodeXInBox, nodeYInBox, depths } of pending) {
    for (const id of box.nodeIds) {
      nodes.set(id, {
        id,
        x: box.x + nodeXInBox.get(id)!,
        y: box.y + nodeYInBox.get(id)!,
        depth: depths.get(id)!,
        rootId: box.rootId,
      })
    }
  }

  // -------------------------------------------------------------------------
  // Phase 5 — compute forest bounding dimensions
  // -------------------------------------------------------------------------

  let forestW = 0
  let forestH = 0
  for (const { box } of pending) {
    const right = box.x + box.width
    const bottom = box.y + box.height
    if (right > forestW) forestW = right
    if (bottom > forestH) forestH = bottom
  }

  const boxes: ComponentBox[] = pending.map(p => p.box)

  return { nodes, boxes, width: forestW, height: forestH }
}
