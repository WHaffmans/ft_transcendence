
import type { PlayerState, Segment } from "./init.js";
import type { TurnInput } from "./step.js";
import type { ColorRGBA } from "./init.js";

type SegmentDelta =
  | { kind: "added"; index: number; x1: number; y1: number; x2: number; y2: number }
  | { kind: "extended"; index: number; x1: number; y1: number; x2: number; y2: number };


/**
 * Append a new trail segment or extend the previous segment for the same player.
 * 
 * @param posEpsilon: 0.000000001, 1-billionth, (10^-9)
 */
export function pushOrExtendSegment(
	segments: Segment[],
	p: PlayerState,
	prevX: number,
	prevY: number,
	x: number,
	y: number,
	turn: TurnInput,
	isGap: boolean,
	color: ColorRGBA,
	posEpsilon = 1e-9,
): SegmentDelta {

	const isTurning = turn !== 0;
	const lastIndex = segments.length - 1;
	const last = segments[lastIndex];

	const canExtend =
		!isTurning &&
		!isGap &&
		last != null &&
		last.ownerId === p.id &&						// Ensure the previous segment belongs to this player
		last.isGap === isGap &&							// Prevent extending across gap/non-gap boundaries
		Math.abs(last.x2 - prevX) <= posEpsilon &&		// Keep `x` the same if it differs by a tiny amount
		Math.abs(last.y2 - prevY) <= posEpsilon;		// Keep `y` the same if it differs by a tiny amount

	if (canExtend) {
		const oldX2 = last.x2;
		const oldY2 = last.y2;

		last.x2 = x;
		last.y2 = y;

		return {
			kind: "extended",
			index: last.i,
			x1: oldX2,
			y1: oldY2,
			x2: x,
			y2: y,
		};
	}

	// New sequence number for this new segment
	p.tailOwnerSeq += 1;
	
	const i = segments.length;
	segments.push({ i, x1: prevX, y1: prevY, x2: x, y2: y, ownerId: p.id, ownerSeq: p.tailOwnerSeq, color, isGap });

  	return {
		kind: "extended",
		index: i,
		x1: prevX,
		y1: prevY,
		x2: x,
		y2: y,
	};
}
