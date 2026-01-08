/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   init.ts                                            :+:    :+:            */
/*                                                     +:+                    */
/*   By: qbeukelm <qbeukelm@student.42.fr>            +#+                     */
/*                                                   +#+                      */
/*   Created: 2025/12/16 11:17:53 by qbeukelm      #+#    #+#                 */
/*   Updated: 2025/12/22 09:32:56 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import { GameConfig } from "./config.ts";
import { makeRng } from "./rng.ts";
import { SpatialHash, createSpatialHash } from "./spatial_hash.ts";

export type PlayerState = {
	id: string;
	x: number; y: number;
	angle: number;
	alive: boolean;
	gapTicksLeft: number;		// Leave whole in trail
	tailSegIndex: number;
};

export type Segment = {
	x1: number; y1: number;		// start point (previous head position)
	x2: number; y2: number;		// end point   (new head position)
	ownerId: string;			// which player created it
};

export type GameState = {
	tick: number;
	seed: number;
	rngState: number;
	players: PlayerState[];
	segments: Segment[];
	spatial: SpatialHash;
};

export function initGame(config: GameConfig, seed: number, playerIds: string[]): GameState {
	const rng = makeRng(seed);

	// Determine spawn
	const players = playerIds.map((id, i) => ({
		id,
		x: 200 + i * 200,
		y: 200 + i * 100,
		angle: 0,
		alive: true,
		gapTicksLeft: 0,
	}));

	const cellSize = config.playerRadius * 4;

	return {
		tick: 0,
		seed,
		rngState: rng.state,
		players,
		segments: [],
		spatial: createSpatialHash(config.arenaWidth, config.arenaHeight, cellSize),
	};
}
