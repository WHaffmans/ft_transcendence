/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   game_simulate.ts                                   :+:    :+:            */
/*                                                     +:+                    */
/*   By: qbeukelm <qbeukelm@student.42.fr>            +#+                     */
/*                                                   +#+                      */
/*   Created: 2025/12/16 12:21:32 by qbeukelm      #+#    #+#                 */
/*   Updated: 2026/02/10 10:06:54 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import { DEFAULT_CONFIG } from "../engine/config.js";
import { initGame } from "../engine/init.js";
import { step } from "../engine/step.js";

const seed = 1234;
let state = initGame(DEFAULT_CONFIG, seed, ["p1", "p2"]);

for (let t = 0; t < 1; t++) {
	state = step(
		state,
		{ p1: (t % 30 < 10 ? -1 : 0), p2: (t % 40 < 10 ? 1 : 0) },
		DEFAULT_CONFIG
	).state;
}

console.log({
	tick: state.tick,
	segs: state.segments,
	p1: state.players.find(p => p.id === "p1"),
	p2: state.players.find(p => p.id === "p2"),
});
