/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   step.ts                                            :+:    :+:            */
/*                                                     +:+                    */
/*   By: qbeukelm <qbeukelm@student.42.fr>            +#+                     */
/*                                                   +#+                      */
/*   Created: 2025/12/16 12:12:32 by qbeukelm      #+#    #+#                 */
/*   Updated: 2025/12/22 09:31:10 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import { GameConfig } from "./config.ts";
import { makeRng } from "./rng.ts";
import type { GameState } from "./init.ts";
import { pushOrExtendSegment } from "./push_segment.ts";
import { checkCollisionThisTick } from "./collision.ts"
import { insertSegmentDDA } from "./spatial_hash.ts";

export type TurnInput = -1 | 0 | 1;

export function step(
	state: GameState,
	inputsById: Record<string, TurnInput>,
	config: GameConfig
): GameState {

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
			continue;
		}
		
		// Collision
		if (p.gapTicksLeft === 0)
		{
			const hit = checkCollisionThisTick(next.spatial, next.segments, p.id, prevX, prevY, p.x, p.y, config.playerRadius, 1);

			if (hit) {
				p.alive = false;
				continue;
			}
		}
		
		// Gap handling
		if (p.gapTicksLeft > 0) {
			p.gapTicksLeft -= 1;
		} else {
			const delta = pushOrExtendSegment(next.segments, p.id, prevX, prevY, p.x, p.y, turn);

			// Add to spacial hash
			insertSegmentDDA(next.spatial, delta.x1, delta.y1, delta.x2, delta.y2, delta.index);
		}
	}

	next.rngState = rng.state;
	return next;
}
