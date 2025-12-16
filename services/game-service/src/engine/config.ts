/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   config.ts                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: qbeukelm <qbeukelm@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/12/16 11:12:05 by qbeukelm          #+#    #+#             */
/*   Updated: 2025/12/16 12:26:14 by qbeukelm         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Difine vairaibles for a game
export type GameConfig = {
	tickRate: number;

	arenaWidth: number;
	arenaHeight: number;

	// Movement
	speed: number;			// units per tick
	turnRate: number;		// radians per tick
	playerRadius: number;

	// Trail / gaps
	gapChance: number;		// probability per tick to START a gap (0..1)
	gapMinTicks: number;
	gapMaxTicks: number;

	// Spawning
	spawnPadding: number;		// distance from walls
	spawnAngle: number;		// radians (random +/-)
};

// Set default values
export const DEFAULT_CONFIG: GameConfig = {
	tickRate: 60,

	arenaWidth: 1200,
	arenaHeight: 800,

	speed: 4.0,
	turnRate: 0.08,
	playerRadius: 4,

	gapChance: 0.007,
	gapMinTicks: 10,
	gapMaxTicks: 35,

	spawnPadding: 60,
	spawnAngle: 0.35,
};
