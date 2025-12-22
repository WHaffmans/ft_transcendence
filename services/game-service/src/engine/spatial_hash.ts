/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   spatial_hash.ts                                    :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2025/12/18 08:11:13 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2025/12/22 12:38:11 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */


// A spatial has is a fast lookup table for nearby geometry.
// We split the arena into a grid if square cells.
// Each cell stores a list of segment indices that pass through that cell.
//
// Then, when a player moves, we only check segments against nearby cells.
// Instead of checking every segment in the whole game.

export type SpatialHash = {
	cellSize: number;
	cols: number;						// Number of columns in the grid
	buckets: Map<number, number[]>;		// Array of segment indicies that live in that cell
};

export function createSpatialHash(arenaWidth: number, arenaHeight: number, cellSize: number): SpatialHash {
	return {
		cellSize,
		cols: Math.ceil(arenaWidth / cellSize),
		buckets: new Map(),
	};
}

/**
 * Convert grid coordinate (cx, cy) into a single integer key.
 * Flattening a 2D array into 1D.
 */
function cellKey(hash: SpatialHash, cx: number, cy: number): number {
	return (cx + cy * hash.cols);
}

/**
 * Put the cell index into one cell's list.
 */
function addToBucket(hash: SpatialHash, key: number, segIndex: number) {
	const arr = hash.buckets.get(key);
	if (arr)
		arr.push(segIndex);
  	else 
		hash.buckets.set(key, [segIndex]);
}

/**
 * Insert a segment into the spatial hash.
 * 
 * A line segment can cross multiple cells, so we "walk along the line"
 * and add this segment index to every well we pass through.
 * 
 * This uses DDA-style sampling (Digital Differential Analyzer).
 * 		- An algorithm used in computer graphics to draw a streight line between two points.
 *		- DDA works by incrementally calculating intermediate points along the line using the lines slope.
 * 
 * 		1. take points along the segment at regular intervals
 * 		2. for each point, compute which cell it is in.
 * 		3. store segIndex for that cell
 * 
 *  y = mx + c -> m = (yend - ystart) / (xend / xstart)
 */
export function insertSegmentDDA(hash: SpatialHash, x1: number, y1: number, x2: number, y2: number, segIndex: number) {

	if (typeof segIndex !== "number" || !Number.isInteger(segIndex) || segIndex < 0) {
  		return;
  	}
	
	// Compute the direction vector start -> end
	const dx = x2 - x1
	const dy = y2 - y1;
	
	// Compute the segment length
	const len = Math.hypot(dx, dy);
	if (len === 0) return;

	// How far between samples along the segment
	const step = hash.cellSize * 0.5;

	// Number of steps/samples. Longer segments get more samples.
	const n = Math.max(1, Math.ceil(len / step));

	// From segment start to segment end
	for (let i = 0; i <= n; i++) {
		
		// t goes 0 -> 1 across the segment
		const t = i / n;

		// Sample point at fraction t of the segment
		const x = x1 + dx * t;
		const y = y1 + dy * t;

		// Convert each sample point into a grid cell coordinate
		const cx = Math.floor(x / hash.cellSize);
		const cy = Math.floor(y / hash.cellSize);

		// Store this segment index in that cell's bucket
		addToBucket(hash, cellKey(hash, cx, cy), segIndex);
  }
}

/**
 * Query an AABB (axis-aligned bounding box).
 *
 * Given a rectangle in world coordinates:
 *   minX,minY ----- maxX,minY
 *      |              |
 *   minX,maxY ----- maxX,maxY
 *
 * Return all segment indices that are stored in any cell overlapping that rectangle.
 * Here we get *candidate* segments nearby, then do exact collision tests on them.
 */
export function queryAabb(hash: SpatialHash, minX: number, minY: number, maxX: number, maxY: number): number[] {
	
	// Convert rectangle from pixels to grid-cell coords
	// These are the inclusive cell ranges to scan
	const c0x = Math.floor(minX / hash.cellSize);
	const c0y = Math.floor(minY / hash.cellSize);
	const c1x = Math.floor(maxX / hash.cellSize);
	const c1y = Math.floor(maxY / hash.cellSize);

	const out: number[] = [];

	// A segment may be stored in multiple cells, so we dedupe
	const seen = new Set<number>();

	// Loop over all grid cells overlapped by the rectangle
	for (let cy = c0y; cy <= c1y; cy++) {
		for (let cx = c0x; cx <= c1x; cx++) {
			
			// Get the list of segment indices for this cell
			const bucket = hash.buckets.get(cellKey(hash, cx, cy));
			if (!bucket) continue;
			
			// Add each segment index once
			for (const idx of bucket) {
				if (typeof idx !== "number" || !Number.isInteger(idx) || idx < 0)
					continue;

				if (!seen.has(idx)) {
					seen.add(idx);
					out.push(idx);
				}
			}
		}
	}
	return (out);
}
