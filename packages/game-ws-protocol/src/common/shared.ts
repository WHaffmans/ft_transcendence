
import { z } from "zod";
import { PlayerId } from "./primitives.js"

export const PlayerSchema = z.object({
	playerId: PlayerId,
	rating_mu: z.number(),
	rating_sigma: z.number(),
});

export type Player = z.infer<typeof PlayerSchema>;
