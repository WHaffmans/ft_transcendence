/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   rng.ts                                             :+:    :+:            */
/*                                                     +:+                    */
/*   By: qbeukelm <qbeukelm@student.42.fr>            +#+                     */
/*                                                   +#+                      */
/*   Created: 2025/12/16 11:24:47 by qbeukelm      #+#    #+#                 */
/*   Updated: 2026/03/09 15:57:37 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

/**
 * Random Number Generator interface.
 *
 * Defines the shape of an RNG object:
 * 		- `state` stores the current internal state
 * 		- `nextFloat()` returns a random float in the range [0, 1)
 * 		- `nextInt(max)` returns a random integer in the range [0, max)
 */
export type Rng = {
	state: number;
	nextFloat(): number; // 0..1
	nextInt(max: number): number; // 0..max-1
};

export function makeRng(seed: number): Rng {

	// `0 >>>` converts seed into an unsigned 32-bit integer.
	let state = seed >>> 0;

	/**
	 * Generate the next pseudo-random unsigned 32-bit integer.
	 *
	 * Uses a `xorshift algorithm`:
	 * Each step mixes the bits using XOR and bit shifts.
	 *
	 * The result is deterministic:
	 * same seed => same sequence.
	 */
	function nextU32() {
		// Mix using left-shift
		state ^= state << 13;
		state >>>= 0;  // keep result as unsigned 32-bit
		
		// Mix using right-shift
		state ^= state >> 17;
		state >>>= 0;
		
		// Mix using left-shift
		state ^= state << 5;
		state >>>= 0;
		
		return (state);
	}

	return {
		get state() { return state; },
		set state(v: number) { state = v >>> 0; },

		/** 
		 * Return a pseudo-random float in the range [0, 1).
		 * 
		 * Dividing by 2^32 maps it to:
		 * 		0 <= result < 1
		 * 
		 * Note:
		 * 		- 0 is possible
		 * 		- 1 is not possible
		 */
		nextFloat() {
			return (nextU32() / 0x100000000);
		},

		/**
		 * Return a pseudo-random integer in the range [0, max).
		 *
		 * Multiplies a random float by `max`, then rounds down
		 * to get a whole number from 0 up to `max - 1`.
		 */
		nextInt(max: number) {
			return (Math.floor(this.nextFloat() * max));
		},
	};
}
