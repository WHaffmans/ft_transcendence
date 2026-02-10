/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   types.ts                                           :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/02/09 13:17:55 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/02/09 13:18:04 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */


export type PlayerId = string;

export type PlayerRating = {
	id: PlayerId;
	mu: number;
	sigma: number;
};

/**
 * index 0  = first player out (worst)
 * last     = winner (best)
 */
export type FinishResult = {
	finishOrder: PlayerId[];
};

export type UpdatedPlayerRating = PlayerRating & {
	ordinal: number;
};
