/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   openskill_adapter.ts                               :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/02/09 13:17:50 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/02/10 10:45:53 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */


import { rating as osRating, rate as osRate, ordinal as osOrdinal } from "openskill";
import type { FinishResult, PlayerId, PlayerRating, UpdatedPlayerRating } from "./types.js";

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
	
	for (const [i, id] of result.finishOrder.entries()) {
		const team = newTeams.at(i);
		const newR = team?.[0];
		if (!newR) {
			throw new Error(`updateRatingsOpenSkill: missing new rating for player ${id} at index ${i}`);
		}
		
		updatedById.set(id, {
			id,
			mu: newR.mu,
			sigma: newR.sigma,
			ordinal: osOrdinal(newR),
		});
	}

		return players.map((p) => {
			const updated = updatedById.get(p.id);
			if (!updated)
				throw new Error(`updateRatingsOpenSkill: missing updated rating for player ${p.id}`);
		return (updated);
	});
}

export function defaultRating(id: PlayerId): PlayerRating {
	const r = osRating();
	return { id, mu: r.mu, sigma: r.sigma };
}
