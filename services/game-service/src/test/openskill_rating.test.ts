import { describe, it, expect } from "vitest";

import { defaultRating, updateRatingsOpenSkill } from "../open_skill/index";

/**
 * Helpers
 */
function byId<T extends { id: string }>(arr: T[], id: string): T {
	const x = arr.find(p => p.id === id);
	if (!x) throw new Error(`Missing id: ${id}`);
	return x;
}

describe("OpenSkill: free-for-all rating update", () => {
	it("Winner gets higher mu/ordinal; first-out gets lower mu/ordinal", () => {
		const players = [
			defaultRating("alice"),
			defaultRating("bob"),
			defaultRating("carl"),
			defaultRating("dina"),
		];

		// first out: alice, then bob, then carl, winner: dina
		const finishOrder = ["alice", "bob", "carl", "dina"];

		const updated = updateRatingsOpenSkill(players, { finishOrder });

		const alice0 = byId(players, "alice");
		const dina0 = byId(players, "dina");

		const alice1 = byId(updated, "alice");
		const dina1 = byId(updated, "dina");

		expect(updated).toHaveLength(players.length);

		// Winner improves
		expect(dina1.mu).toBeGreaterThan(dina0.mu);
		expect(dina1.ordinal).toBeGreaterThan(osOrdinalFromMuSigma(dina0.mu, dina0.sigma));

		// First-out worsens
		expect(alice1.mu).toBeLessThan(alice0.mu);
		expect(alice1.ordinal).toBeLessThan(osOrdinalFromMuSigma(alice0.mu, alice0.sigma));

		// Winner ends above first-out
		expect(dina1.mu).toBeGreaterThan(alice1.mu);
		expect(dina1.ordinal).toBeGreaterThan(alice1.ordinal);

		expect(dina1.sigma).toBeLessThan(dina0.sigma);
		expect(alice1.sigma).toBeLessThan(alice0.sigma);
	});

	it("Order of `players` input does not matter (ids drive mapping)", () => {
		const playersA = [
			defaultRating("alice"),
			defaultRating("bob"),
			defaultRating("carl"),
			defaultRating("dina"),
		];

		const playersB = [
			byId(playersA, "dina"),
			byId(playersA, "bob"),
			byId(playersA, "alice"),
			byId(playersA, "carl"),
		];

		const finishOrder = ["alice", "bob", "carl", "dina"];

		const updatedA = updateRatingsOpenSkill(playersA, { finishOrder });
		const updatedB = updateRatingsOpenSkill(playersB, { finishOrder });

		// Compare by id (not by array index)
		for (const id of ["alice", "bob", "carl", "dina"]) {
			expect(byId(updatedA, id).mu).toBeCloseTo(byId(updatedB, id).mu, 12);
			expect(byId(updatedA, id).sigma).toBeCloseTo(byId(updatedB, id).sigma, 12);
			expect(byId(updatedA, id).ordinal).toBeCloseTo(byId(updatedB, id).ordinal, 12);
		}
	});

	it("Throws if finishOrder contains an unknown player id", () => {
		const players = [defaultRating("alice")];

		expect(() =>
			updateRatingsOpenSkill(players, { finishOrder: ["alice", "not_a_player"] }),
		).toThrow(/unknown player/i);
	});
});


function osOrdinalFromMuSigma(mu: number, sigma: number): number {
	return mu - 3 * sigma;
}
