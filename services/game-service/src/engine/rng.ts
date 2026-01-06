/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   random_number_generator.ts                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: qbeukelm <qbeukelm@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/12/16 11:24:47 by qbeukelm          #+#    #+#             */
/*   Updated: 2025/12/16 11:31:11 by qbeukelm         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Random Number Generator
export type Rng = {
	state: number;
	nextFloat(): number; // 0..1
	nextInt(max: number): number; // 0..max-1
};

export function makeRng(seed: number): Rng {
	let state = seed >>> 0;

	function nextU32() {
		state ^= state << 13; state >>>= 0;
		state ^= state >> 17; state >>>= 0;
		state ^= state << 5; state >>>= 0;
		return state;
	}

	return {
		get state() { return state; },
		set state(v: number) { state = v >>> 0; },

		nextFloat() {
			return nextU32() / 0x100000000; // 2^32
		},

		nextInt(max: number) {
			return Math.floor(this.nextFloat() * max);
		},
	};
}
