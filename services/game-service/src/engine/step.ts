/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   step.ts                                            :+:    :+:            */
/*                                                     +:+                    */
/*   By: qbeukelm <qbeukelm@student.42.fr>            +#+                     */
/*                                                   +#+                      */
/*   Created: 2025/12/16 12:12:32 by qbeukelm      #+#    #+#                 */
/*   Updated: 2026/01/09 09:41:42 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import { GameConfig } from "./config.ts";
import { makeRng } from "./rng.ts";
import type { GameState } from "./init.ts";
import { pushOrExtendSegment } from "./push_segment.ts";
import { checkCollisionThisTick } from "./collision.ts"
import { insertSegmentDDA } from "./spatial_hash.ts";

export type TurnInput = -1 | 0 | 1;

export type StepResult = {
	state: GameState;
	justFinished: boolean;
	winnerId: string | null;
};

function randIntInclusive(rng: any, min: number, max: number) {
	const t = rng.nextFloat();
	return min + Math.floor(t * (max - min + 1));
}

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
	const next: GameState = {
		...state,
		tick: state.tick + 1,
		players: state.players.map(p => ({ ...p })),
		segments: state.segments.slice(),
		spatial: state.spatial,
	};

	const rng = makeRng(state.rngState);

	// Loop through players
	for (const p of next.players) {
		if (!p.alive) continue;

		const turn = inputsById[p.id] ?? 0;
		p.angle += turn * config.turnRate;

		const prevX = p.x, prevY = p.y;

		p.x += Math.cos(p.angle) * config.speed;
		p.y += Math.sin(p.angle) * config.speed;

		// Wall death
		if (p.x < 0 || p.x > config.arenaWidth || p.y < 0 || p.y > config.arenaHeight) {
			p.alive = false;
			recordDeath(next, p.id);
			continue;
		}
		
		// Collision
		const effectiveRadius = config.playerRadius * 2;
		const hit = checkCollisionThisTick(
			next.spatial,
			next.segments,
			p.id,
			prevX,
			prevY,
			p.x,
			p.y,
			effectiveRadius,
			p.tailSegIndex,
			5,
		);


		if (hit) {
			p.alive = false;
			recordDeath(next, p.id);
			continue;
		}

		// Gap handling
		if (p.gapTicksLeft <= 0) {
			if (rng.nextFloat() < config.gapChance) {
				p.gapTicksLeft = randIntInclusive(rng, config.gapMinTicks, config.gapMaxTicks);
			}
  		}

		const isGap = p.gapTicksLeft > 0;

		if (isGap) {
			p.gapTicksLeft -= 1;
		}

		const delta = pushOrExtendSegment(next.segments, p.id, prevX, prevY, p.x, p.y, turn, isGap, p.color);

		// Add to spacial hash
		if (!isGap) {
			p.tailSegIndex = delta.index;
			insertSegmentDDA(next.spatial, delta.x1, delta.y1, delta.x2, delta.y2, delta.index);
		}
	}

	next.rngState = rng.state;

	// Compute winner
	const alive = next.players.filter(p => p.alive);
	let winnerId: string | null = null;

	if (alive.length === 1) {
		winnerId = alive[0].id;
		next.winnerId = winnerId;
	}

	return {
		state: next,
		justFinished: winnerId !== null,
		winnerId,
	};
}
