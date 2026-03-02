/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   init.ts                                            :+:    :+:            */
/*                                                     +:+                    */
/*   By: qbeukelm <qbeukelm@student.42.fr>            +#+                     */
/*                                                   +#+                      */
/*   Created: 2025/12/16 11:17:53 by qbeukelm      #+#    #+#                 */
/*   Updated: 2026/03/02 11:47:02 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import { GameConfig } from "./config.js";
import { makeRng } from "./rng.js";
import { randomInt } from "node:crypto";
import { SpatialHash, createSpatialHash } from "./spatial_hash.js";
import { spawnPlayers } from "./spawn_players.js";

export type ColorRGBA = {
	r: number,
	g: number,
	b: number,
	a: number,
};

export type PlayerState = {
	id: string;
	x: number; y: number;
	angle: number;
	alive: boolean;
	gapTicksLeft: number;		// Leave whole in trail
	tailSegIndex: number;
	tailOwnerSeq: number;		// Sequence number for tail segments
	color: ColorRGBA;
};

export type Segment = {
	i: number,
	x1: number; y1: number;		// start point (previous head position)
	x2: number; y2: number;		// end point   (new head position)
	ownerId: string;			// which player created it
	ownerSeq: number;			// per-player monotonic sequence
	color: ColorRGBA;
	isGap: boolean,
};

export type GameState = {
	tick: number;
	seed: number;
	rngState: number;
	players: PlayerState[];
	segments: Segment[];
	spatial: SpatialHash;
	winnerId: string | null;
	deathIdByIndex: Map<number, string>;	// (index, playerId)
};


export function initGame(config: GameConfig, seed: number, playerIds: string[]): GameState {
	const actualSeed = seed ? seed : randomInt(0, 1_000_000_000);
	const rng = makeRng(actualSeed);

	const players = spawnPlayers(config, rng, playerIds);
	const cellSize = config.playerRadius * 4;

	return {
		tick: 0,
		seed: actualSeed,
		rngState: rng.state,
		players,
		segments: [],
		spatial: createSpatialHash(config.arenaWidth, config.arenaHeight, cellSize),
		winnerId: null,
		deathIdByIndex: new Map(),
	};
}
