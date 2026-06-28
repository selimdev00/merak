/**
 * dsu.ts
 *
 * Pure Union-Find / Disjoint-Set-Union engine with full step-and-snapshot
 * instrumentation for the visualizer. Every public method returns an Operation
 * whose `steps` array captures the full before/after story with independent
 * deep-copied Snapshots so the UI can scrub history without aliasing.
 *
 * Deterministic: no randomness inside. Config-driven strategy (size/rank/naive)
 * and path-compression (full/halving/off) with tie-break rules documented inline.
 */

import type {
  UFConfig,
  Snapshot,
  Step,
  StepKind,
  Operation,
} from './types'

// ---------------------------------------------------------------------------
// Exported helper
// ---------------------------------------------------------------------------

/** Build a Snapshot from raw arrays, deep-copying each array. */
export function snapshotOf(
  parent: number[],
  size: number[],
  rank: number[],
  count: number,
): Snapshot {
  return {
    parent: parent.slice(),
    size: size.slice(),
    rank: rank.slice(),
    count,
  }
}

// ---------------------------------------------------------------------------
// DSU class
// ---------------------------------------------------------------------------

export class DSU {
  parent: number[]
  size: number[]
  rank: number[]
  count: number
  config: UFConfig

  private _opId: number

  constructor(n: number, config: UFConfig) {
    this.parent = Array.from({ length: n }, (_, i) => i)
    this.size = Array.from({ length: n }, () => 1)
    this.rank = Array.from({ length: n }, () => 0)
    this.count = n
    this.config = { ...config }
    this._opId = 0
  }

  /** Merge a partial config patch into the current config. */
  setConfig(patch: Partial<UFConfig>): void {
    this.config = { ...this.config, ...patch }
  }

  /** Deep-copy the current DSU state into a Snapshot. */
  snapshot(): Snapshot {
    return snapshotOf(this.parent, this.size, this.rank, this.count)
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  /**
   * Walk parent pointers to root WITHOUT compression.
   * Used by union and connected so those operations stay pure (no side-effects
   * on the tree; find is where compression happens).
   */
  private rootOfPlain(x: number): number {
    let cur = x
    while (this.parent[cur] !== cur) {
      cur = this.parent[cur]
    }
    return cur
  }

  /**
   * Build a Step with an independent deep-copy snapshot taken at call time
   * (i.e. AFTER any mutations for that beat have been applied).
   */
  private makeStep(
    kind: StepKind,
    fields: Partial<Pick<Step, 'node' | 'from' | 'to' | 'a' | 'b' | 'path'>>,
    caption: string,
  ): Step {
    return {
      kind,
      ...fields,
      caption,
      snapshot: this.snapshot(),
    }
  }

  // -------------------------------------------------------------------------
  // Public DSU operations
  // -------------------------------------------------------------------------

  /**
   * Find the root of x, emitting per-node steps for every visited node and
   * then a compression step (if enabled) after all nodes have been re-parented.
   */
  find(x: number): Operation {
    const snapshotBefore = this.snapshot()
    const steps: Step[] = []

    // -- Build the path from x to root by plain walking (no mutation yet). ---
    const path: number[] = []
    let cur = x
    while (this.parent[cur] !== cur) {
      path.push(cur)
      cur = this.parent[cur]
    }
    path.push(cur) // root is the last element
    const root = cur

    // -- Edge: x is already the root. ----------------------------------------
    if (path.length === 1) {
      steps.push(
        this.makeStep(
          'find-root',
          { node: x, path: [x], a: x },
          `find(${x}): ${x} is already a root`,
        ),
      )
      return {
        id: this._opId++,
        kind: 'find',
        a: x,
        label: `find(${x})`,
        steps,
        snapshotBefore,
        result: root,
      }
    }

    // -- Emit find-visit for each non-root node (state unchanged). ------------
    for (let i = 0; i < path.length - 1; i++) {
      const node = path[i]
      const parentNode = path[i + 1]
      steps.push(
        this.makeStep(
          'find-visit',
          { node, path: path.slice(0, i + 1), a: x },
          `find(${x}): at ${node}, parent is ${parentNode}`,
        ),
      )
    }

    // -- Emit find-root (state still unchanged). ------------------------------
    steps.push(
      this.makeStep(
        'find-root',
        { node: root, path: path.slice(), a: x },
        `find(${x}): reached root ${root}`,
      ),
    )

    // -- Apply path compression (mutates parent[]). ---------------------------
    const { pathCompression } = this.config

    if (pathCompression === 'full') {
      // Set every non-root path node directly to root.
      const moved: number[] = []
      for (let i = 0; i < path.length - 1; i++) {
        const node = path[i]
        if (this.parent[node] !== root) {
          this.parent[node] = root
          moved.push(node)
        }
      }
      if (moved.length > 0) {
        steps.push(
          this.makeStep(
            'compress',
            { to: root, path: moved, a: x },
            `path compression: ${moved.join(', ')} now point straight at root ${root}`,
          ),
        )
      }
    } else if (pathCompression === 'halving') {
      // Point each node to its grandparent; skip the last two (root's child + root).
      const moved: number[] = []
      for (let i = 0; i < path.length - 2; i++) {
        const node = path[i]
        const grandparent = this.parent[this.parent[node]]
        if (this.parent[node] !== grandparent) {
          this.parent[node] = grandparent
          moved.push(node)
        }
      }
      if (moved.length > 0) {
        steps.push(
          this.makeStep(
            'compress',
            { to: root, path: moved, a: x },
            `path halving: ${moved.join(', ')} now point to grandparent (root ${root})`,
          ),
        )
      }
    }
    // 'off': no compression step.

    return {
      id: this._opId++,
      kind: 'find',
      a: x,
      label: `find(${x})`,
      steps,
      snapshotBefore,
      result: root,
    }
  }

  /**
   * Union the sets containing a and b.
   * Never compresses paths — that is find's job. Emits exactly one step:
   * 'self', 'noop-connected', or 'link'.
   */
  union(a: number, b: number): Operation {
    const snapshotBefore = this.snapshot()
    const steps: Step[] = []

    // -- Edge: union(a, a). --------------------------------------------------
    if (a === b) {
      const selfRoot = this.rootOfPlain(a)
      steps.push(
        this.makeStep(
          'self',
          { node: a, a, b },
          `union(${a}, ${a}): a node is always in its own set; nothing to merge`,
        ),
      )
      return {
        id: this._opId++,
        kind: 'union',
        a,
        b,
        label: `union(${a}, ${b})`,
        steps,
        snapshotBefore,
        result: false,
        effective: false,
        rootA: selfRoot,
        rootB: selfRoot,
      }
    }

    const ra = this.rootOfPlain(a)
    const rb = this.rootOfPlain(b)

    // -- Already in the same set. --------------------------------------------
    if (ra === rb) {
      steps.push(
        this.makeStep(
          'noop-connected',
          { node: ra, a, b },
          `union(${a}, ${b}): already in the same set (root ${ra}); no change`,
        ),
      )
      return {
        id: this._opId++,
        kind: 'union',
        a,
        b,
        label: `union(${a}, ${b})`,
        steps,
        snapshotBefore,
        result: false,
        effective: false,
        rootA: ra,
        rootB: rb,
      }
    }

    // -- Link by strategy. ---------------------------------------------------
    let childRoot: number
    let parentRoot: number

    const { unionStrategy } = this.config

    if (unionStrategy === 'size') {
      // Smaller tree attaches under larger. Tie: ra attaches under rb.
      if (this.size[ra] > this.size[rb]) {
        childRoot = rb
        parentRoot = ra
      } else {
        childRoot = ra
        parentRoot = rb
      }
    } else if (unionStrategy === 'rank') {
      // Lower rank attaches under higher. Equal rank: rb under ra, rank[ra]++.
      if (this.rank[ra] < this.rank[rb]) {
        childRoot = ra
        parentRoot = rb
      } else if (this.rank[ra] > this.rank[rb]) {
        childRoot = rb
        parentRoot = ra
      } else {
        childRoot = rb
        parentRoot = ra
        this.rank[parentRoot]++
      }
    } else {
      // naive: always attach ra under rb.
      childRoot = ra
      parentRoot = rb
    }

    this.parent[childRoot] = parentRoot
    this.size[parentRoot] += this.size[childRoot]
    this.count--

    steps.push(
      this.makeStep(
        'link',
        { from: childRoot, to: parentRoot, node: childRoot, a, b },
        `union(${a}, ${b}): merged set ${childRoot} under root ${parentRoot} (new size ${this.size[parentRoot]})`,
      ),
    )

    return {
      id: this._opId++,
      kind: 'union',
      a,
      b,
      label: `union(${a}, ${b})`,
      steps,
      snapshotBefore,
      result: true,
      effective: true,
      rootA: ra,
      rootB: rb,
    }
  }

  /**
   * Check whether a and b are in the same set.
   * Does NOT mutate (no compression). Emits lightweight steps showing root
   * resolution for each side, then a YES/NO closing step.
   */
  connected(a: number, b: number): Operation {
    const snapshotBefore = this.snapshot()
    const steps: Step[] = []

    const ra = this.rootOfPlain(a)
    const rb = this.rootOfPlain(b)

    // One summarising step per side.
    steps.push(
      this.makeStep(
        'find-root',
        { node: ra, a, b },
        `connected: ${a} resolves to root ${ra}`,
      ),
    )
    steps.push(
      this.makeStep(
        'find-root',
        { node: rb, a, b },
        `connected: ${b} resolves to root ${rb}`,
      ),
    )

    const same = ra === rb

    steps.push(
      this.makeStep(
        'find-root',
        { node: ra, a, b },
        `connected(${a}, ${b}) -> ${same ? 'YES, same set' : 'NO, different sets'}`,
      ),
    )

    return {
      id: this._opId++,
      kind: 'connected',
      a,
      b,
      label: `connected(${a}, ${b})`,
      steps,
      snapshotBefore,
      result: same,
      rootA: ra,
      rootB: rb,
    }
  }

  /**
   * Reset the DSU to n fresh singletons, discarding all previous structure.
   */
  reset(n: number): Operation {
    const snapshotBefore = this.snapshot()

    this.parent = Array.from({ length: n }, (_, i) => i)
    this.size = Array.from({ length: n }, () => 1)
    this.rank = Array.from({ length: n }, () => 0)
    this.count = n

    const steps: Step[] = [
      this.makeStep('reset', {}, `reset to ${n} singletons`),
    ]

    return {
      id: this._opId++,
      kind: 'reset',
      label: `reset(${n})`,
      steps,
      snapshotBefore,
    }
  }

  /**
   * Append a new singleton element. Its id is the current array length.
   */
  makeSet(): Operation {
    const snapshotBefore = this.snapshot()
    const id = this.parent.length

    this.parent.push(id)
    this.size.push(1)
    this.rank.push(0)
    this.count++

    const steps: Step[] = [
      this.makeStep('makeset', { node: id }, `added element ${id} as a new singleton`),
    ]

    return {
      id: this._opId++,
      kind: 'makeset',
      label: `makeSet()`,
      steps,
      snapshotBefore,
    }
  }
}
