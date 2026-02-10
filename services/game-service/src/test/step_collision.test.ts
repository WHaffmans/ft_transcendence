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

	// 1) ====================================              Collide         ====================================
	it("Positive collision test", () => {
		const config: GameConfig = {
			arenaWidth: 500,
			arenaHeight: 500,
			speed: 10,
			turnRate: 0,
			playerRadius: 2,
			gapChance: 0,
			gapMinTicks: 0,
			gapMaxTicks: 0,
		} as GameConfig;

		const cellSize = config.playerRadius * 4;

		const initial: GameState = {
			tick: 0,
			seed: 12345,
			rngState: 12345,

			players: [
				{
					id: "p1",
					x: 40,
					y: 100,
					angle: 0,
					alive: true,
					gapTicksLeft: 0,
					tailSegIndex: -1,
					color: { r: 255, g: 255, b: 255, a: 1 },
				},
				{
					id: "p2",
					x: 95,
					y: 35,
					angle: Math.PI / 2,
					alive: true,
					gapTicksLeft: 0,
					tailSegIndex: -1,
					color: { r: 255, g: 255, b: 255, a: 1 },
				},
			],

			segments: [],
			spatial: createSpatialHash(config.arenaWidth, config.arenaHeight, cellSize),
			winnerId: null,
			deathIdByIndex: new Map(),
		} as unknown as GameState;

		let state = initial;

		const inputs: Record<string, TurnInput> = { p1: 0, p2: 0 };

		let justFinished = false;
		let winnerId: string | null = null;

		for (let i = 0; i < 10; i++) {
			const res = step(state, inputs, config);
			state = res.state;
			justFinished ||= res.justFinished;
			winnerId = res.winnerId ?? winnerId;

			if (!getPlayer(state, "p1").alive || !getPlayer(state, "p2").alive) break;
		}

		expect(state.tick).toBeLessThanOrEqual(10);
		expect(getPlayer(state, "p1").alive).toBe(true);
		expect(getPlayer(state, "p2").alive).toBe(false);
		expect(justFinished).toBe(true);
		expect(winnerId).toBe("p1");
	});

	// 2) ====================================              No Collision    ====================================
	it("Negative collision test", () => {
		const config: GameConfig = {
			arenaWidth: 500,
			arenaHeight: 500,
			speed: 2,
			turnRate: 0,
			playerRadius: 2,
			gapChance: 0,
			gapMinTicks: 0,
			gapMaxTicks: 0,
		} as GameConfig;

		const cellSize = config.playerRadius * 4;

		const initial: GameState = {
			tick: 0,
			seed: 12345,
			rngState: 12345,

			players: [
				{
					id: "p1",
					x: 50,
					y: 150,
					angle: 0,
					alive: true,
					gapTicksLeft: 0,
					tailSegIndex: -1,
					color: { r: 255, g: 255, b: 255, a: 1 },
				},
				{
					id: "p2",
					x: 50,
					y: 350,
					angle: 0,
					alive: true,
					gapTicksLeft: 0,
					tailSegIndex: -1,
					color: { r: 255, g: 255, b: 255, a: 1 },
				},
			],

			segments: [],
			spatial: createSpatialHash(config.arenaWidth, config.arenaHeight, cellSize),

			winnerId: null,
			deathIdByIndex: new Map(),
		} as unknown as GameState;

		let state = initial;
		const inputs: Record<string, TurnInput> = { p1: 0, p2: 0 };

		let justFinished = false;
		let winnerId: string | null = null;
		const targetTicks = 5;

		for (let i = 0; i < targetTicks; i++) {
			const res = step(state, inputs, config);
			state = res.state;

			justFinished ||= res.justFinished;
			winnerId = res.winnerId ?? winnerId;

			expect(getPlayer(state, "p1").alive).toBe(true);
			expect(getPlayer(state, "p2").alive).toBe(true);
		}

		expect(state.tick).toBe(targetTicks);
		expect(justFinished).toBe(false);
		expect(winnerId).toBe(null);
	});
});
