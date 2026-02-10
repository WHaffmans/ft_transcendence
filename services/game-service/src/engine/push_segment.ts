
import type { Segment } from "./init.js";
import type { TurnInput } from "./step.js";
import type { ColorRGBA } from "./init.js";

type SegmentDelta =
  | { kind: "added"; index: number; x1: number; y1: number; x2: number; y2: number }
  | { kind: "extended"; index: number; x1: number; y1: number; x2: number; y2: number };

export function pushOrExtendSegment(
	segments: Segment[],
	ownerId: string,
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
		last.ownerId === ownerId &&
		last.isGap === isGap &&						// Don't extend across boundru
		Math.abs(last.x2 - prevX) <= posEpsilon &&
		Math.abs(last.y2 - prevY) <= posEpsilon;

	if (canExtend) {
		const oldX2 = last.x2;
		const oldY2 = last.y2;

		last.x2 = x;
		last.y2 = y;

		return {
			kind: "extended",
			index: lastIndex,
			x1: oldX2,
			y1: oldY2,
			x2: x,
			y2: y,
		};
	}

	segments.push({ x1: prevX, y1: prevY, x2: x, y2: y, ownerId, color, isGap });

	const newIndex = segments.length - 1;

  	return {
		kind: "extended",
		index: newIndex,
		x1: prevX,
		y1: prevY,
		x2: x,
		y2: y,
	};
}
