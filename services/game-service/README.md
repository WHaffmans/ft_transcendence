# Game Service

### Setup

```bash
npm i -D tsx
npm i -D vitest
```

---
<br/>


# Collision Detection

## Problem statement

At each simulation tick, each player advances from a previous position ($x_{t-1}, y_{t-1} $) to a new position ($x_t, y_t$). we model this per-tick movement as a **swept segment**:

The game maintains a growing set of tail segments $Ti$ representing where players have been. A collision occurs when the moving player's swept segment comes within radius $r$ (the "thickness" of the tail / player) of any trail segment:

A naive approac checks $S$ against all trail segments each tick, yeilding $O(N)$ tests per player per tick (where $N$ is the number of existing trail segments). Because $N$ grows over time, this becomes the dominiant cost.

We will adopt a common two-stage approach used in real-time collision detection:

1. **broad-phase:** candidate reduction
1. **narrow-phase:** exact testing

---
<br/>


## Data representation

Trail segments as persistent primitives. Each tick appends one tail segment per alive player (with possible gaps). Each stored tail segment is:

- endpoints $ A = (a_x, a_y), B = (b_x, b_y)$
- an axis-aligend bounding box (AABB) around $\overline{AB}$, extended by radius $r$.
- an element in a spacial index.

This representation turns "where the player has been" into a geometric set (polyline), enabling collision tests without needing a tilemap.

---
<br/>


## Broad-phase: Spatial hashing & DDA grid traversal

### 1) Spatial hashing (uniform grid hashed into a table)

![Spatial Hashing](documentation/Index%20Hashing.png)

> Figure 1: Diagram of objects (A - J) mapped to object index

We overlay a uniform grid with cell size $h$ and store each segment $T_i$ in all grid cells overlapped by its AABB. This is a classic spatial hashing approach: expected $O(1)$ insertion/lookup.

We do this using a bounding box:
 
- A bounging box is the smallest axis-alighend rectangle that contains a single trail segment.
- We use it to figure out which gird cells a trail segemnt touches.
- Add the segement's id into those cells' buckets in the spacial hash.


### 2) DDA gird traversal

![DDA Algorithm](documentation/DDA%20Algorithm.png)

> Figure 2: Image showing line drawn with DDA algorithm

To find nearby segments for a moving player, we must enumerate which grid cells the swept segment passes through. We do this with an incremental Digital Differential Analyzer (DDA)-style traversal.

The algorithm steps cell-by-cell along the segment direction, generating a list of nearby candidates.

Candidate generation procedure:

1. Traverse all cells intersected by the swept segment $S$ using DDA.
2. For each visited cell, query the spatial hash bucket and collect segment references.
3. Avoid narrow-phase duplicate tests with dedulplicate references.

---
<br/>


## Narrow-phase: Exact distance test using squared distances

For each candidate trail segment:

- compute the closest distance between your movement segment and that trail segment
- compare it to your collision radius $r$.

We do it with squared distance (no square roots):

- if `distanceSquared <= r*r` -> collision
