/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   step.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: qbeukelm <qbeukelm@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/12/16 12:12:32 by qbeukelm          #+#    #+#             */
/*   Updated: 2025/12/16 12:45:43 by qbeukelm         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { GameConfig } from "./config.ts";
import { makeRng } from "./random_number_generator.ts";
import type { GameState, Segment } from "./init.ts";

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

		// Gap handling
		if (p.gapTicksLeft > 0) {
			p.gapTicksLeft -= 1;
		} else {
			const seg: Segment = { x1: prevX, y1: prevY, x2: p.x, y2: p.y, ownerId: p.id };
			next.segments.push(seg);
		}

		// Wall death
		if (p.x < 0 || p.x > config.arenaWidth || p.y < 0 || p.y > config.arenaHeight) {
			p.alive = false;
		}
	}

	next.rngState = rng.state;
	return next;
}
