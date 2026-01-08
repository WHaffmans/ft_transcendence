/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   collision.ts                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: qbeukelm <qbeukelm@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/12/18 10:10:00 by quentinbeuk       #+#    #+#             */
/*   Updated: 2025/12/23 11:21:35 by qbeukelm         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

/**
 * Idea:
 * 		- Each tick, a player moves from (prevX, prevY) -> (x, y).
 *		- We treat that movement as a small line segment (the "swept path").
 *		- We want to know if that swept path comes within "radius" of any existing tail segments.
 * 
 * Efficiency:
 *		- Broad-phase: We ask the spatial hash for only nearby segments.
 * 		- Narrow-phase: then do exact math checks on those candidates.
 */

import { SpatialHash, queryAabb } from "./spatial_hash";
import type { Segment } from "./init";

/**
 * Clamp a value into the interval [lo, hi]
 *
 * Used when projecting onto a segment:
 *  - t < 0 => closest point is the segment start
 *  - t > 1 => closest point is the segment end
 */
function clamp(v: number, lo: number, hi: number) {
	return (Math.max(lo, Math.min(hi, v)));
}

/**
 * Squared distance from a POINT P(px,py) to a LINE SEGMENT AB.
 *
 * Why squared distance?
 *	- avoids sqrt (faster)
 *	- we can compare squared distances: distSq <= radius^2
 *
 * Method (closest point on segment):
 *	1. Project point P onto the infinite line through A->B using dot products.
 *	2. Clamp the projection to the segment (t in [0,1]).
 *	3. Compute distance between P and the closest point on the segment.
 *
 * Terms:
 *  - Dot product: measure how much two vectors point in the same direction.
 *  - Clamp: forcing a value to stay inside a range.
 */
function distPointToSegSq(
  	px: number, py: number,
	ax: number, ay: number,
	bx: number, by: number
): number {

	// Vector AB
	const abx = bx - ax, aby = by - ay;
	// Vector AP
	const apx = px - ax, apy = py - ay;
	// Length squared of AB
	const abLenSq = abx * abx + aby * aby;
	
	// If A and B are the same point, distance is just |AP|^2
	if (abLenSq === 0)
		return (apx * apx + apy * apy);
	
	// Projection factor t = (AP·AB) / |AB|^2, clamped to [0..1]
	// t=0 => closest point is A
	// t=1 => closest point is B
	const t = clamp((apx * abx + apy * aby) / abLenSq, 0, 1);

	// Closest point C on the segment
	const cx = ax + abx * t
	const cy = ay + aby * t;
	
	// Distance squared from P to C
	const dx = px - cx, dy = py - cy;
	return (dx * dx + dy * dy);
}


/**
 * Used to test if two segments intersect.
 *
 * Returns:
 *	- `>` 0 if C is to the "left" of the directed line A->B
 *	- `<` 0 if C is to the "right"
 *	- `=` 0 if A, B, C are collinear
 */
function orient(ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
  	return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

/**
 * Check if point P lies on the segment AB, the "bounding box" check.
 */
function onSegment(ax: number, ay: number, bx: number, by: number, px: number, py: number) {
  	return (
		Math.min(ax, bx) <= px && px <= Math.max(ax, bx) &&
		Math.min(ay, by) <= py && py <= Math.max(ay, by)
	);
}

/**
 * Exact segment intersection test
 *
 * "radius" collisions:
 * - If the two segments cross, distance is 0, so we can short-circuit quickly.
 * - For non-intersecting segments, we compute minimal distance.
 */
function segmentsIntersect(a: Segment, b: Segment): boolean {
	const o1 = orient(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1);
	const o2 = orient(a.x1, a.y1, a.x2, a.y2, b.x2, b.y2);
	const o3 = orient(b.x1, b.y1, b.x2, b.y2, a.x1, a.y1);
	const o4 = orient(b.x1, b.y1, b.x2, b.y2, a.x2, a.y2);

	// General case: endpoints are on opposite sides
	if ((o1 > 0) !== (o2 > 0) && (o3 > 0) !== (o4 > 0))
		return (true);

	// Special cases: collinear overlap/touch
  	if (o1 === 0 && onSegment(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1)) return (true);
  	if (o2 === 0 && onSegment(a.x1, a.y1, a.x2, a.y2, b.x2, b.y2)) return (true);
  	if (o3 === 0 && onSegment(b.x1, b.y1, b.x2, b.y2, a.x1, a.y1)) return (true);
  	if (o4 === 0 && onSegment(b.x1, b.y1, b.x2, b.y2, a.x2, a.y2)) return (true);

  	return (false);
}

function worldToCell(hash: SpatialHash, x: number, y: number) {
  	const cx = Math.floor(x / hash.cellSize);
  	const cy = Math.floor(y / hash.cellSize);
  	return { cx, cy, key: `${cx},${cy}` };
}

/**
 * Collide if the swept path comes within radius of any tail segment
 */
function distSegToSegSq(a: Segment, b: Segment): number {
	if (segmentsIntersect(a, b))
		return (0);

	const d1 = distPointToSegSq(a.x1, a.y1, b.x1, b.y1, b.x2, b.y2);
	const d2 = distPointToSegSq(a.x2, a.y2, b.x1, b.y1, b.x2, b.y2);
	const d3 = distPointToSegSq(b.x1, b.y1, a.x1, a.y1, a.x2, a.y2);
	const d4 = distPointToSegSq(b.x2, b.y2, a.x1, a.y1, a.x2, a.y2);
  
	return (Math.min(d1, d2, d3, d4));
}

/**
 * Steps:
 *  1) Build the swept segment "move".
 *  2) Compute an AABB around that movement expanded by `radius` (conservative broad-phase).
 *  3) Query spatial hash for candidate segment indices overlapping that AABB.
 *  4) Narrow-phase: exact distance test (segment-to-segment) against each candidate.
 */
export function checkCollisionThisTick(
	hash: SpatialHash,
	segments: Segment[],
	ownerId: string,
	prevX: number,
	prevY: number,
	x: number,
	y: number,
	radius: number,
	ignoreLastSegmentsOfSelf: Set<number>,
): boolean {

	// The swept path for this tick
	const move: Segment = { x1: prevX, y1: prevY, x2: x, y2: y, ownerId };

	// Broad-phase AABB of the swept segment, expanded by radius.
	const minX = Math.min(prevX, x) - radius;
	const minY = Math.min(prevY, y) - radius;
	const maxX = Math.max(prevX, x) + radius;
	const maxY = Math.max(prevY, y) + radius;

	// Returns indices into `segments[]` for segments whose registered cells overlap this AABB.
	const candidates = queryAabb(hash, minX, minY, maxX, maxY);

	const r2 = radius * radius;

	// Narrow-phase exact checks on candidates only
	for (const idx of candidates) {
		if (idx == null || idx < 0 || idx >= segments.length) continue;

		if (ignoreLastSegmentsOfSelf.has(idx)) continue;

		// True collision if the minimal distance between segments is within radius
		const s = segments[idx];
		const d2 = distSegToSegSq(move, s);

		const moveCell1 = worldToCell(hash, move.x1, move.y1);
		const moveCell2 = worldToCell(hash, move.x2, move.y2);
		const candCell1 = worldToCell(hash, s.x1, s.y1);
		const candCell2 = worldToCell(hash, s.x2, s.y2);

		console.log("MOVE", move);
		console.log("CELL move", moveCell1, moveCell2, "cand", candCell1, candCell2);
		console.log("CAND", { idx, owner: s.ownerId, x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, d2, r2: r2 });

		if (d2 <= r2)
			return (true);
	}

	return (false);
}
