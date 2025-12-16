/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   simulate.ts                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: qbeukelm <qbeukelm@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/12/16 12:21:32 by qbeukelm          #+#    #+#             */
/*   Updated: 2025/12/16 12:38:52 by qbeukelm         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { DEFAULT_CONFIG } from "../engine/config.ts";
import { initGame } from "../engine/init.ts";
import { step } from "../engine/step.ts";

const seed = 1234;
let state = initGame(DEFAULT_CONFIG, seed, ["p1", "p2"]);

for (let t = 0; t < 1; t++) {
	state = step(
		state,
		{ p1: (t % 30 < 10 ? -1 : 0), p2: (t % 40 < 10 ? 1 : 0) },
		DEFAULT_CONFIG
	);
}

console.log({
	tick: state.tick,
	segs: state.segments.length,
	p1: state.players.find(p => p.id === "p1"),
	p2: state.players.find(p => p.id === "p2"),
});
