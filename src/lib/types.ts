// Core types for the Union-Find / DSU visualizer.
// The pure engine (dsu.ts), layout (layout.ts) and the Vue layer all speak these.

export type UnionStrategy = 'size' | 'rank' | 'naive'
export type Compression = 'full' | 'halving' | 'off'

export interface UFConfig {
  unionStrategy: UnionStrategy
  pathCompression: Compression
}

/** Immutable structural snapshot, taken AFTER a step applies. Rendering is a pure function of one of these. */
export interface Snapshot {
  parent: number[]
  size: number[]
  rank: number[]
  count: number // number of disjoint components
}

export type StepKind =
  | 'find-visit' // walking from a node toward its root
  | 'find-root' // reached the representative
  | 'compress' // reparented a node closer to the root
  | 'link' // attached one root under another
  | 'noop-connected' // union of two already-connected nodes
  | 'self' // union(a, a) or find on the same node
  | 'makeset' // created a new singleton
  | 'reset'

/** One atomic, animatable beat of an operation. */
export interface Step {
  kind: StepKind
  node?: number // primary node in focus
  from?: number // previous parent (compression / link)
  to?: number // new parent / target root
  a?: number
  b?: number
  path?: number[] // visited path for find/compress beats
  caption: string // plain-language "what just happened"
  snapshot: Snapshot // structure AFTER this step
}

export type OperationKind = 'union' | 'find' | 'connected' | 'reset' | 'makeset' | 'remove'

/** A user-facing operation: a group of steps with a summary result. */
export interface Operation {
  id: number
  kind: OperationKind
  a?: number
  b?: number
  label: string // e.g. "union(3, 7)"
  steps: Step[]
  snapshotBefore: Snapshot
  /** find -> resulting root; connected -> boolean; union -> whether a merge happened. */
  result?: number | boolean
  effective?: boolean // union actually merged two distinct sets
  rootA?: number
  rootB?: number
}

// ---- Layout ----

export interface LayoutNode {
  id: number
  x: number
  y: number
  depth: number
  rootId: number
}

export interface ComponentBox {
  rootId: number
  x: number
  y: number
  width: number
  height: number
  nodeIds: number[]
  size: number
  height_levels: number // tree height in levels (1 = singleton)
}

export interface ForestLayout {
  nodes: Map<number, LayoutNode>
  boxes: ComponentBox[]
  width: number
  height: number
}

// ---- Metrics ----

export interface Metrics {
  count: number // components
  totalOps: number
  effectiveUnions: number
  noopUnions: number
  maxHeight: number // tallest tree, in levels
  lastFindPathLength: number
}
