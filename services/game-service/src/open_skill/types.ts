

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
