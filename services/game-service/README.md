<h1 align="center">
    Game Service
</h1>

The **Game Service** is responsible for the real-time simulation layer of the multiplayer game implemented in the *ft_transcendence* project. It manages deterministic game state updates, player movement, collision detection, and synchronization between connected clients through WebSocket communication.

The service is designed to operate as a dedicated microservice within the overall system architecture, enabling scalable and responsive multiplayer gameplay. At its core lies a tick-based simulation engine that advances the game state at fixed intervals, ensuring deterministic behaviour across all connected players.

One of the key technical challenges addressed by the Game Service is efficient collision detection in a continuously growing trail environment. Each player's movement generates persistent trail segments that must be checked for collisions in real time. To maintain performance as the number of segments increases, the system implements a two-stage collision detection pipeline consisting of:

- **Broad-phase spatial partitioning** using spatial hashing
- **Narrow-phase geometric collision testing** using exact segment distance calculations

This document describes the setup of the Game Service as well as the mathematical and algorithmic principles underlying the collision detection system used within the simulation engine.

<br/>

---
<br/>
<br/>



# Table of Contents

- [Introduction](#introduction)
- [Setup Help](#setup-help)
- [Collision Detection](#collision-detection)
  - [Problem Statement](#problem-statement)
  - [Data Representation](#data-representation)
  - [Broad-phase: Spatial Hashing & DDA Grid Traversal](#broad-phase-spatial-hashing--dda-grid-traversal)
  - [Narrow-phase: Exact Distance Test Using Squared Distances](#narrow-phase-exact-distance-test-using-squared-distances)
  - [Summary](#summary)
- [Sources](#sources)

<br/>

---
<br/>
<br/>



# Setup Help

1.  Run compose install:

```bash
	# PHP composer
	cd services/backend-service/src
	composer install
```

2. Make dependencies

```bash
	make deps
```

3. npm install

```bash
	# update workspace
	npm --workspace @ft/game-ws-protocol run build

	# In folder
	rm -rf node_modules; rm -f package-lock.json; npm cache verify
```

4. Restart game service

```bash
	docker compose up -d --build game-service
```

5. Ensure npm packages

```bash
	npm i -D tsx
	npm i -D vitest

	npm i ws
	npm i -D @types/ws

	npm i openskill
	npm i dotenv
```

<br/>

---
<br/>
<br/>



# Collision Detection

## Problem statement

At each simulation tick, each player advances from a previous position ($x_{t-1}, y_{t-1} $) to a new position ($x_t, y_t$). We model this per-tick movement as $S$, a **swept segment**:

$$S = \overline{P_0P_1}$$

$$P_0 = (x_{t - 1}, y_{t - 1})$$

$$P_1 = (x_t, y_t)$$

The game maintains a growing set of trail segments $Ti$ representing where players have been. A collision occurs when the moving player's swept segment comes within radius $r$ (the "thickness" of the trail / player) of any trail segment:

$$\min_i d(S, T_i) \le r$$

- $d(.,.)$ the minimum Euclidean distance between two line segments.
- $T_i$ the i-th trail segment.

A naive approach checks $S$ against all trail segments each tick, yielding $O(N)$ tests per player per tick (where $N$ is the number of existing trail segments). Because $N$ grows over time, this becomes the dominant cost.

We will adopt a common two-stage approach used in real-time collision detection:

1. **broad-phase:** candidate reduction
1. **narrow-phase:** exact testing

<br/>

---
<br/>
<br/>



## Data representation

Trail segments as persistent primitives. Each tick appends one trail segment per alive player (with possible gaps). Each stored trail segment is:

- endpoints $A=(a_x, a_y), B=(b_x, b_y)$
- an axis-aligend bounding box (AABB) around $\overline{AB}$, extended by radius $r$.
- an element in a spatial index.

This representation turns "where the player has been" into a geometric set (polyline), enabling collision tests without needing a tilemap.

<br/>

---
<br/>
<br/>



## Broad-phase: Spatial hashing & DDA grid traversal

### 1) Spatial hashing (uniform grid hashed into a table)

![Spatial Hashing](documentation/Index%20Hashing.png)

> **Figure 1:** Diagram of objects (A - J) mapped to object index

<br/>

We overlay a uniform grid with cell size $h$ and store each segment $T_i$ in all grid cells overlapped by its (extended) AABB. This is a classic spatial hashing approach: expected $O(1)$ insertion/lookup.

We do this using a bounding box **AABB (Axis Aligned Bounding Box)**:
 
- A bounding box is the smallest **axis-alighend** rectangle that contains a single trail segment.
- We expand it by $r$ so that the broad-phase is conservative.
- We map the box to grid cell coordinates and store the segment index in each overlapped cell bucket.

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


### 2) DDA grid traversal

![DDA Algorithm](documentation/DDA%20Algorithm.png)

> Figure 2: Image showing line drawn with DDA algorithm

<br/>

To find nearby segments for a moving player, we enumerate which grid cells the swept segment $S$ passes through. We do this with an incremental **Digital Differential Analyzer (DDA)** traversal.

The algorithm steps cell-by-cell along the segment direction, generating a list of nearby candidates.

Candidate generation procedure:

1. Traverse all cells intersected by the swept segment $S$ using DDA.
2. For each visited cell, query the spatial hash bucket and collect segment indices.
3. Avoid narrow-phase duplicate tests with deduplicate references.

Broad-phase cost per tick (per-player):

- $k$ visited cells $⇒ O(k)$
- $m$ unique candidates returned $⇒ O(m)$

Overall: $O(k + m)$, typically far smaller than O(N).

<br/>

---
<br/>
<br/>



## Narrow-phase: Exact distance test using squared distances

For each candidate trail segment $T$:

- compute the minimum distance between swept segments $S$ and $T$
- compare it to collision radius $r$.

We use **squared distance** (avoids square roots):

$$ d^2 (S, T) ≤ r^2 ⇒ collision$$

Each candidate check is $O(1)$, so narrow-phase is $O(m)$.

<br/>

---
<br/>
<br/>



## Summary

Per tick, per player:

- broad-phase: traverse nearby cells and fetch candidates $ ≈ O(k + m) $
- narrow-phase: exact checks only on candidates $ ≈ O(m) $

This keeps collision cost stable as the trail grows, instead of degrading with total segment count $N$.

<br/>

---
<br/>
<br/>


# Sources

## Collision Detection & Optimisation

- Ericson, C. (2005).  
  *Real-Time Collision Detection.* Morgan Kaufmann.

- Teschner, M., Heidelberger, B., Müller, M., Pomeranets, D., & Gross, M. (2003).  
  *Optimized Spatial Hashing for Collision Detection of Deformable Objects.*

- Amanatides, J., & Woo, A. (1987).  
  *A Fast Voxel Traversal Algorithm for Ray Tracing.*

<br/>

---

*Document written by Quentin Beukelman*