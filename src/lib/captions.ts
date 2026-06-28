/**
 * captions.ts
 *
 * Pure formatting helpers for the DSU visualizer UI.
 * All functions are stateless and side-effect-free.
 * Captions for individual Steps are produced inline by dsu.ts;
 * these helpers are for the operation log and path-display layers.
 */

import type { Operation } from './types'

// ---------------------------------------------------------------------------
// ordinal
// ---------------------------------------------------------------------------

/** Convert a non-negative integer to its English ordinal string.
 *  e.g. 1 -> "1st", 2 -> "2nd", 11 -> "11th", 21 -> "21st". */
export function ordinal(n: number): string {
  const mod100 = n % 100
  const mod10 = n % 10
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  if (mod10 === 1) return `${n}st`
  if (mod10 === 2) return `${n}nd`
  if (mod10 === 3) return `${n}rd`
  return `${n}th`
}

// ---------------------------------------------------------------------------
// describeOperation
// ---------------------------------------------------------------------------

/** One-line human summary for an operation log row.
 *  Derived purely from the Operation's fields; never reads live DSU state. */
export function describeOperation(op: Operation): string {
  switch (op.kind) {
    case 'union':
      if (op.a === op.b) {
        return `${op.label} - self (no-op)`
      }
      if (op.effective) {
        return `${op.label} - merged (roots ${op.rootA} + ${op.rootB})`
      }
      return `${op.label} - already connected`

    case 'find':
      return `${op.label} -> ${op.result}`

    case 'connected':
      return `${op.label} -> ${op.result ? 'same set' : 'different sets'}`

    case 'reset':
      return op.label

    case 'makeset':
      return op.label

    case 'remove':
      return op.label
  }
}

// ---------------------------------------------------------------------------
// pathToString
// ---------------------------------------------------------------------------

/** Format a path array as "2 -> 7 -> 5". */
export function pathToString(path: number[]): string {
  return path.join(' -> ')
}
