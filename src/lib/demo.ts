/**
 * demo.ts
 *
 * Canonical pedagogical demo sequence for the DSU visualizer.
 *
 * Arc (n=12, nodes 0-11):
 *   Phase 1 - Build cluster {0,1,2,3} with size-union (root 3, depth 2 from 0).
 *   Phase 2 - Build cluster {4,5,6,7} with size-union (root 7). Includes one
 *             intentional no-op union to illustrate the already-connected case.
 *   Phase 3 - Build a 4-hop chain 8->9->10->11->3 using naive union so the
 *             unbalanced structure survives (size-union would flatten it).
 *   Phase 4 - Switch to full path compression, then find(8) traverses the
 *             5-node path [8,9,10,11,3] and flattens 8, 9, 10 to point at 3.
 *   Phase 5 - connected(4,8) returns NO (different sets), union(3,7) merges
 *             the two remaining components, connected(4,8) returns YES.
 */

import { DSU } from './dsu'
import type { Operation } from './types'

export function buildDemo(): { n: number; operations: Operation[] } {
  const n = 12
  const dsu = new DSU(n, { unionStrategy: 'size', pathCompression: 'off' })
  const operations: Operation[] = []

  // -------------------------------------------------------------------------
  // Phase 1: size-based unions building {0,1,2,3}
  //
  //   union(0,1):  tie (1=1)  -> parent[0]=1,   size[1]=2          root=1
  //   union(2,3):  tie (1=1)  -> parent[2]=3,   size[3]=2          root=3
  //   union(1,3):  tie (2=2)  -> parent[1]=3,   size[3]=4          root=3
  //   Path from 0: 0 -> 1 -> 3  (depth 2 from root)
  // -------------------------------------------------------------------------
  operations.push(dsu.union(0, 1))
  operations.push(dsu.union(2, 3))
  operations.push(dsu.union(1, 3))

  // -------------------------------------------------------------------------
  // Phase 2: size-based unions building {4,5,6,7}; last union is a no-op
  //
  //   union(4,5):  tie (1=1)  -> parent[4]=5,   size[5]=2          root=5
  //   union(6,7):  tie (1=1)  -> parent[6]=7,   size[7]=2          root=7
  //   union(5,7):  tie (2=2)  -> parent[5]=7,   size[7]=4          root=7
  //   union(4,6):  root(4)=7, root(6)=7 -> NOOP (already connected)
  // -------------------------------------------------------------------------
  operations.push(dsu.union(4, 5))
  operations.push(dsu.union(6, 7))
  operations.push(dsu.union(5, 7))
  operations.push(dsu.union(4, 6)) // intentional no-op

  // -------------------------------------------------------------------------
  // Phase 3: naive unions to build a tall chain without size-balancing
  //
  //   union(8,9):   naive -> parent[8]=9,              root=9
  //   union(9,10):  naive -> parent[9]=10,             chain: 8->9->10
  //   union(10,11): naive -> parent[10]=11,            chain: 8->9->10->11
  //   union(8,3):   ra=root(8)=11, rb=root(3)=3
  //                 naive -> parent[11]=3, size[3]+=4  chain: 8->9->10->11->3
  //
  //   After this phase find(8) will traverse a 5-node path.
  // -------------------------------------------------------------------------
  dsu.setConfig({ unionStrategy: 'naive' })

  operations.push(dsu.union(8, 9))
  operations.push(dsu.union(9, 10))
  operations.push(dsu.union(10, 11))
  operations.push(dsu.union(8, 3))

  // -------------------------------------------------------------------------
  // Phase 4: enable full path compression, then find(8) to flatten the chain
  //
  //   path = [8, 9, 10, 11, 3]
  //   After full compression: parent[8]=3, parent[9]=3, parent[10]=3
  //   (parent[11] was already 3 so it doesn't move)
  // -------------------------------------------------------------------------
  dsu.setConfig({ pathCompression: 'full', unionStrategy: 'size' })

  operations.push(dsu.find(8))

  // -------------------------------------------------------------------------
  // Phase 5: connected(NO) -> union -> connected(YES)
  //
  //   4 is in {4,5,6,7} (root 7); 8 is now in {0..3,8..11} (root 3) -> NO
  //   union(3,7): size[3]=8 > size[7]=4 -> parent[7]=3, size[3]=12
  //   Now all nodes share root 3 -> connected(4,8) -> YES
  // -------------------------------------------------------------------------
  operations.push(dsu.connected(4, 8))
  operations.push(dsu.union(3, 7))
  operations.push(dsu.connected(4, 8))

  return { n, operations }
}
