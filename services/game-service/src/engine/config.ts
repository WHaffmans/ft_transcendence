/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   config.ts                                          :+:    :+:            */
/*                                                     +:+                    */
/*   By: qbeukelm <qbeukelm@student.42.fr>            +#+                     */
/*                                                   +#+                      */
/*   Created: 2025/12/16 11:12:05 by qbeukelm      #+#    #+#                 */
/*   Updated: 2026/03/04 18:00:45 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

// Difine vairaibles for a game
export type GameConfig = {
	tickRate: number;

	arenaWidth: number;
	arenaHeight: number;

	// Movement
	speed: number;					// units per tick
	turnSpeedModifier: number;		// multiplier for turn rate based on speed (0..1)
	turnRate: number;				// radians per tick
	playerRadius: number;
	segmentSendCount: number;		// number of segments sent in a snapshot

	// Trail / gaps
	gapChance: number;				// probability per tick to START a gap (0..1)
	gapMinTicks: number;
	gapMaxTicks: number;

	spawnPadding: number;
	spawnAngle: number;
};

// Set default values
export const DEFAULT_CONFIG: GameConfig = {
	tickRate: 1,

	arenaWidth: 800,
	arenaHeight: 800,

	speed: 4.0,
	turnSpeedModifier: 0.65,
	turnRate: 0.1,
	playerRadius: 2,
	segmentSendCount: 15,

	gapChance: 0.03,
	gapMinTicks: 2,
	gapMaxTicks: 8,

	spawnPadding: 100,
	spawnAngle: 0.35,
};
