# Game Service

`http://localhost:5173/game`

### Setup

```bash
npm i -D tsx
npm i -D vitest

npm i ws
npm i -D @types/ws
```

---
<br/>

# Rooms

## Manual testing

Install wscat globally

```bash
npm i -g wscat
```

Run game-service

```bash
cd services/game-service
npm run dev
```

In a new terminal

```bash
wscat -c ws://localhost:3002/internal
```

Send `create_room`:

```json
{"type":"create_room","roomId":"r1","seed":1,"config":{"tickHz":30},"players":[{"playerId":"p1"},{"playerId":"p2"}]}
```

Send inputs:

```json
{"type":"input","roomId":"r1","playerId":"p1","turn":-1}
{"type":"input","roomId":"r1","playerId":"p2","turn":1}
```

---
<br/>


## Testing in Browser

Open JavaScript terminal

Open the web socket

```JavaScript
const ws = new WebSocket("ws://localhost:3003/ws");

ws.onopen = () => console.log("WS open");
ws.onmessage = (e) => console.log("WS msg:", e.data);
ws.onerror = (e) => console.log("WS error:", e);
ws.onclose = (e) => console.log("WS close:", e.code, e.reason);

const send = (obj) => ws.send(JSON.stringify(obj));
```

Send `create_room`

```JavaScript
send({
  type: "create_room",
  roomId: "r1",
  seed: 1,
  config: {}, // optional overrides
  players: [{ playerId: "p1" }, { playerId: "p2" }]
});
```

Join the room

```JavaScript
send({ type: "join_room", roomId: "r1", playerId: "p1" });
```

Send input

```JavaScript
send({ type: "input", turn: -1 });
```

---
<br/>



# Collision Detection

## Problem statement

At each simulation tick, each player advances from a previous position ($x_{t-1}, y_{t-1} $) to a new position ($x_t, y_t$). We model this per-tick movement as $S$, a **swept segment**:

$$S = \overline{P_0P_1}$$

$$P_0 = (x_{t - 1}, y_{t - 1})$$

$$P_1 = (x_t, y_t)$$

The game maintains a growing set of trail segments $Ti$ representing where players have been. A collision occurs when the moving player's swept segment comes within radius $r$ (the "thickness" of the tail / player) of any trail segment:

$$\min_i d(S, T_i) \le r$$

- $d(.,.)$ the minimum Euclidean distance between two line segments.
- $T_i$ the i-th trail segment.

A naive approah checks $S$ against all trail segments each tick, yeilding $O(N)$ tests per player per tick (where $N$ is the number of existing trail segments). Because $N$ grows over time, this becomes the dominiant cost.

We will adopt a common two-stage approach used in real-time collision detection:

1. **broad-phase:** candidate reduction
1. **narrow-phase:** exact testing

---
<br/>


## Data representation

Trail segments as persistent primitives. Each tick appends one tail segment per alive player (with possible gaps). Each stored tail segment is:

- endpoints $A=(a_x, a_y), B=(b_x, b_y)$
- an axis-aligend bounding box (AABB) around $\overline{AB}$, extended by radius $r$.
- an element in a spacial index.

This representation turns "where the player has been" into a geometric set (polyline), enabling collision tests without needing a tilemap.

---
<br/>


## Broad-phase: Spatial hashing & DDA grid traversal

### 1) Spatial hashing (uniform grid hashed into a table)

![Spatial Hashing](documentation/Index%20Hashing.png)

> **Figure 1:** Diagram of objects (A - J) mapped to object index

<br/>

We overlay a uniform grid with cell size $h$ and store each segment $T_i$ in all grid cells overlapped by its (extended) AABB. This is a classic spatial hashing approach: expected $O(1)$ insertion/lookup.

We do this using a bounding box **AABB (Axis Aligned Bounding Box)**:
 
- A bounging box is the smallest **axis-alighend** rectangle that contains a single trail segment.
- We expand it by $r$ so that the broad-phase is conservative.
- We map the box to grid cell coordinates and store the segment index in each overlapped vell bucket.

Expanded AABB for each segment $\overline{AB}$:

$$
\begin{aligned}
\min X &= \min(a_x,b_x) - r, \\
\max X &= \max(a_x,b_x) + r, \\
\min Y &= \min(a_y,b_y) - r, \\
\max Y &= \max(a_y,b_y) + r
\end{aligned}
$$

<br/>


### 2) DDA gird traversal

![DDA Algorithm](documentation/DDA%20Algorithm.png)

> Figure 2: Image showing line drawn with DDA algorithm

<br/>

To find nearby segments for a moving player, we enumerate which grid cells the swept segment $S$ passes through. We do this with an incremental **Digital Differential Analyzer (DDA)** traversal.

The algorithm steps cell-by-cell along the segment direction, generating a list of nearby candidates.

Candidate generation procedure:

1. Traverse all cells intersected by the swept segment $S$ using DDA.
2. For each visited cell, query the spatial hash bucket and collect segment indices.
3. Avoid narrow-phase duplicate tests with dedulplicate references.

Broad-phase cost per tick (per-player):

- $k$ visited cells $⇒ O(k)$
- $m$ unique candidates returned $⇒ O(N)$

Overall: $O(k + m)$, typically far smaller than O(N).

---
<br/>


## Narrow-phase: Exact distance test using squared distances

For each candidate trail segment $T$:

- compute the minimum distance between swept segments $S$ and $T$
- compare it to collision radius $r$.

We use **squared distance** (avoids square roots):

$$ d^2 (S, T) ≤ r^2 ⇒ collision$$

Each candidate check is $O(1)$, so narrow-phase is $O(m)$.

---
<br/>


## Summary

Per tick, per player:

- broad-phase: traverse nearby cells and fetch candidates $ ≈ O(k + m) $
- narrow-phase: exact checks only on candidates $ ≈ O(m) $

This keeps collision cost stable as the trail grows, instead of degrading with total segment count $N$.
