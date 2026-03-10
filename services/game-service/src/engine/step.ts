/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   step.ts                                            :+:    :+:            */
/*                                                     +:+                    */
/*   By: qbeukelm <qbeukelm@student.42.fr>            +#+                     */
/*                                                   +#+                      */
/*   Created: 2025/12/16 12:12:32 by qbeukelm      #+#    #+#                 */
/*   Updated: 2026/03/09 16:32:06 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import { GameConfig } from "./config.js";
import { makeRng } from "./rng.js";
import type { GameState } from "./init.js";
import { pushOrExtendSegment } from "./push_segment.js";
import { checkCollisionThisTick } from "./collision.js"
import { insertSegmentDDA } from "./spatial_hash.js";

export type TurnInput = -1 | 0 | 1;

export type StepResult = {
	state: GameState;
	justFinished: boolean;
	winnerId: string | null;
};

/**
 * Random int
 * Including min and max. Rounded to nearest decimal.
 */
function randIntInclusive(rng: any, min: number, max: number) {
	const t = rng.nextFloat();
	return (min + Math.floor(t * (max - min + 1)));
}

/**
 * 
 */
function recordDeath(state: GameState, playerId: string) {
	for (const id of state.deathIdByIndex.values()) {
		if (id === playerId) return;
	}

	const idx = state.deathIdByIndex.size;
	state.deathIdByIndex.set(idx, playerId);
}

export function step(
	state: GameState,
	inputsById: Record<string, TurnInput>,
	config: GameConfig
): StepResult {

	// Clone state
	const nextState: GameState = {
		...state,
		tick: state.tick + 1,
		players: state.players.map(p => ({ ...p })),
		segments: state.segments.slice(),
		spatial: state.spatial,
	};

	const rng = makeRng(state.rngState);
	const deathsThisTick: string[] = [];

	// Update each living player
	for (const p of nextState.players) {
		if (!p.alive) continue;

		const turn = inputsById[p.id] ?? 0;

		// Convert player input into angular rotation
		const rotation = turn * config.turnRate;

		// Apply movement speed
		// Reduced speed when turning
		p.angle += rotation;
		const speed = config.speed * (turn !== 0 ? config.turnSpeedModifier : 1);

		const prevX = p.x, prevY = p.y;

		// New player position:
		// 		- `cos` gives the horizontal part of the direction
		// 		- `sin` gives the vertical part of the direction
		//		- Multiplying by `speed` scales that unit direction
		p.x += Math.cos(p.angle) * speed;
		p.y += Math.sin(p.angle) * speed;

		// Wall death
		if (p.x < 0 || p.x > config.arenaWidth || p.y < 0 || p.y > config.arenaHeight) {
			p.alive = false;
			recordDeath(nextState, p.id);
			deathsThisTick.push(p.id);
			continue;
		}
		
		// Collision
		const effectiveRadius = config.playerRadius;
		const hit = checkCollisionThisTick(
			nextState.spatial,
			nextState.segments,
			p.id,
			prevX,
			prevY,
			p.x,
			p.y,
			effectiveRadius,
			p.tailSegIndex,
			p.tailOwnerSeq,
			5,
		);

		if (hit) {
			p.alive = false;
			recordDeath(nextState, p.id);
			deathsThisTick.push(p.id);
			continue;
		}

		// Gap handling:
		// 		- Randomly decide wheather to start gap
		//		- If gap starts, it lasts for a random number of ticks
		if (p.gapTicksLeft <= 0) {
			if (rng.nextFloat() < config.gapChance) {
				p.gapTicksLeft = randIntInclusive(rng, config.gapMinTicks, config.gapMaxTicks);
			}
  		}

		const isGap = p.gapTicksLeft > 0;
		if (isGap) {
			p.gapTicksLeft -= 1;
		}

		const newSegment = pushOrExtendSegment(nextState.segments, p, prevX, prevY, p.x, p.y, turn, isGap, p.color);

		// Add to spacial hash
		if (!isGap) {
			p.tailSegIndex = newSegment.index;
			insertSegmentDDA(nextState.spatial, newSegment.x1, newSegment.y1, newSegment.x2, newSegment.y2, newSegment.index);
		}
	}

	nextState.rngState = rng.state;

	// Compute winner
	const alive = nextState.players.filter(p => p.alive);
	let winnerId: string | null = null;

	if (alive.length === 1) {
		winnerId = alive[0]!.id;
		nextState.winnerId = winnerId;
	
	// Avoid deadlock, simultanious deaths
	} else if (alive.length === 0) {
		deathsThisTick.sort();
		if (deathsThisTick.length > 0) {
			winnerId = deathsThisTick[deathsThisTick.length - 1]!; // survived longest this tick
			nextState.winnerId = winnerId;
		}
	}

	return {
		state: nextState,
		justFinished: winnerId !== null,
		winnerId,
	};
}
