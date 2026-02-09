

import { rating as osRating, rate as osRate, ordinal as osOrdinal } from "openskill";
import type { FinishResult, PlayerId, PlayerRating, UpdatedPlayerRating } from "./types";

/**
 * finishOrder: [firstOut, ..., winner]
 */
export function updateRatingsOpenSkill(
	players: PlayerRating[],
	result: FinishResult,
): UpdatedPlayerRating[] {
	const byId = new Map<PlayerId, PlayerRating>();
	for (const p of players)
        byId.set(p.id, p);

	for (const id of result.finishOrder) {
		if (!byId.has(id)) {
			throw new Error(`updateRatingsOpenSkill: finishOrder contains unknown player id: ${id}`);
		}
	}

	const teams = result.finishOrder.map((id) => {
		const p = byId.get(id)!;
		return [osRating({ mu: p.mu, sigma: p.sigma })];
	});

	const n = result.finishOrder.length;
	const rank = result.finishOrder.map((_, idx) => n - idx);

	const newTeams = osRate(teams, { rank });

	const updatedById = new Map<PlayerId, UpdatedPlayerRating>();
	for (let i = 0; i < result.finishOrder.length; i++) {
		const id = result.finishOrder[i];
		const newR = newTeams[i][0];
		updatedById.set(id, {
			id,
			mu: newR.mu,
			sigma: newR.sigma,
			ordinal: osOrdinal(newR),
		});
	}

	return players.map((p) => updatedById.get(p.id)!);
}

export function defaultRating(id: PlayerId): PlayerRating {
	const r = osRating();
	return { id, mu: r.mu, sigma: r.sigma };
}
