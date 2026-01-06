/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   step_collision.test.ts                             :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2025/12/22 12:20:12 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2025/12/22 12:49:36 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import { describe, it, expect } from "vitest";

import { step } from "../engine/step";
import type { TurnInput } from "../engine/step";
import { createSpatialHash } from "../engine/spatial_hash";
import type { GameState } from "../engine/init";
import type { GameConfig } from "../engine/config";

/**
 * Helper for player id retrieval
 */
function getPlayer(state: GameState, id: string) {
	const p = state.players.find(p => p.id === id);

	if (!p)
		throw new Error(`Missing player ${id}`);
	
  return (p);
}

// TESTS
describe("step(): does collide", () => {
	
	// 1) ====================================		Collide		====================================
	it("Positive collision test", () => {
		
		const config: GameConfig = {
    		arenaWidth: 500,
    		arenaHeight: 500,
    		speed: 10,
    		turnRate: 0,
    		playerRadius: 2,
   		} as GameConfig;

		const cellSize = config.playerRadius * 4;

		const initial: GameState = {
			tick: 0,
			seed: 12345,
			rngState: 12345,

			players: [
				{ id: "p1", x: 40, y: 100, angle: 0, alive: true, gapTicksLeft: 0 },
				{ id: "p2", x: 95, y: 35, angle: Math.PI / 2, alive: true, gapTicksLeft: 0 },
			],

			segments: [],
			spatial: createSpatialHash(config.arenaWidth, config.arenaHeight, cellSize),
		};

		let state = initial;

		const inputs: Record<string, TurnInput> = { p1: 0, p2: 0 };

		for (let i = 0; i < 10; i++) {
			state = step(state, inputs, config);
			if (!getPlayer(state, "p1").alive || !getPlayer(state, "p2").alive)
				break;
		}

		expect(state.tick).toBeLessThanOrEqual(10);
		expect(getPlayer(state, "p1").alive).toBe(true);
		expect(getPlayer(state, "p2").alive).toBe(false);
	});

	// 2) ====================================		No Collision	====================================
	it("Negative collision test", () => {
		const config: GameConfig = {
			arenaWidth: 500,
			arenaHeight: 500,
			speed: 2,
			turnRate: 0,
			playerRadius: 2,
    	} as GameConfig;

    	const cellSize = config.playerRadius * 4;

    	const initial: GameState = {
    		tick: 0,
    		seed: 12345,
    		rngState: 12345,

			players: [
				{ id: "p1", x: 50, y: 150, angle: 0, alive: true, gapTicksLeft: 0 },
				{ id: "p2", x: 50, y: 350, angle: 0, alive: true, gapTicksLeft: 0 },
			],

			segments: [],
			spatial: createSpatialHash(config.arenaWidth, config.arenaHeight, cellSize),
    	};

		let state = initial;

    	const inputs: Record<string, TurnInput> = { p1: 0, p2: 0 };

    	for (let i = 0; i < 100; i++) {
    		state = step(state, inputs, config);
			if (!getPlayer(state, "p1").alive || !getPlayer(state, "p2").alive)
				break;
    	}

		expect(state.tick).toBe(100);
		expect(getPlayer(state, "p1").alive).toBe(true);
		expect(getPlayer(state, "p2").alive).toBe(true);
	});
});
