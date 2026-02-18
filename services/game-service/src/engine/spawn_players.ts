/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   spawn_players.ts                                   :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/02/18 09:13:34 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/02/18 09:20:45 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import { GameConfig } from "./config.js";
import type { ColorRGBA } from "./init.js";
import { PlayerState } from "./init.js";
import { Rng } from "./rng.js";

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

	return (hsvToRgba(hue, saturation, value));
}

export function spawnPlayers(config: GameConfig, rng: Rng, playerIds: string[]): PlayerState[] {
	const ids = [...playerIds].sort();

	const margin = config.playerRadius * 6;
	const minDist = config.playerRadius * 10;

	const randIn = (min: number, max: number) => min + rng.nextFloat() * (max - min);

	const placed: Array<{ x: number; y: number }> = [];

	function isFarEnough(x: number, y: number) {
		for (const p of placed) {
			const dx = x - p.x;
			const dy = y - p.y;
			if (dx * dx + dy * dy < minDist * minDist) return false;
		}
		return (true);
	}

	return ids.map((id, i) => {
		let x = 0, y = 0;

		for (let attempt = 0; attempt < 50; attempt++) {
			x = randIn(margin, config.arenaWidth - margin);
			y = randIn(margin, config.arenaHeight - margin);
			if (isFarEnough(x, y)) break;
		}

		placed.push({ x, y });

		const angle = randIn(0, Math.PI * 2);

		return {
			id,
			x,
			y,
			angle,
			alive: true,
			gapTicksLeft: 0,
			tailSegIndex: 0,
			color: playerColor(i, ids.length),
		};
	});
}
