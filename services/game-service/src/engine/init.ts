/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   init.ts                                            :+:    :+:            */
/*                                                     +:+                    */
/*   By: qbeukelm <qbeukelm@student.42.fr>            +#+                     */
/*                                                   +#+                      */
/*   Created: 2025/12/16 11:17:53 by qbeukelm      #+#    #+#                 */
/*   Updated: 2026/01/09 09:54:57 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import { GameConfig } from "./config.ts";
import { makeRng } from "./rng.ts";
import { randomInt } from "node:crypto";
import { SpatialHash, createSpatialHash } from "./spatial_hash.ts";

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
	color: ColorRGBA;
};

export type Segment = {
	x1: number; y1: number;		// start point (previous head position)
	x2: number; y2: number;		// end point   (new head position)
	ownerId: string;			// which player created it
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

function hsvToRgba(h: number, s: number, v: number): ColorRGBA {
	const c = v * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = v - c;

	let r = 0, g = 0, b = 0;

	if (h < 60)      [r, g, b] = [c, x, 0];
	else if (h < 120)[r, g, b] = [x, c, 0];
	else if (h < 180)[r, g, b] = [0, c, x];
	else if (h < 240)[r, g, b] = [0, x, c];
	else if (h < 300)[r, g, b] = [x, 0, c];
	else             [r, g, b] = [c, 0, x];

	return {
		r: Math.round((r + m) * 255),
		g: Math.round((g + m) * 255),
		b: Math.round((b + m) * 255),
		a: 255
	};
}


function playerColor(index: number, total: number): ColorRGBA {
	const hue = (index * 360) / total; // evenly spaced
	const saturation = 0.85;           // vivid
	const value = 0.9;                 // not dark

	return hsvToRgba(hue, saturation, value);
}


export function initGame(config: GameConfig, seed: number, playerIds: string[]): GameState {
	const actualSeed = seed ? 0 : randomInt(0, 100);
	const rng = makeRng(actualSeed);

	// Determine spawn
	const players = playerIds.map((id, i) => ({
		id,
		x: 200 + i * 200,
		y: 200 + i * 100,
		angle: 0,
		alive: true,
		gapTicksLeft: 0,
		tailSegIndex: 0,
		color: playerColor(i, playerIds.length),
	}));

	const cellSize = config.playerRadius * 4;

	return {
		tick: 0,
		seed,
		rngState: rng.state,
		players,
		segments: [],
		spatial: createSpatialHash(config.arenaWidth, config.arenaHeight, cellSize),
		winnerId: null,
		deathIdByIndex: new Map(),
	};
}
