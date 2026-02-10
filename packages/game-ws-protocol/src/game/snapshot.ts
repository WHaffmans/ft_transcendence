
import { z } from "zod";
import { RoomId, PlayerId } from "../common/primitives.js";

export const GamePhaseSchema = z.enum(["lobby", "ready", "running", "finished"]);
export const PlayerPhaseSchema = z.enum(["lobby", "game"]);

export const ColorRGBASchema = z.object({
	r: z.number().int().min(0).max(255),
	g: z.number().int().min(0).max(255),
	b: z.number().int().min(0).max(255),
	a: z.number().int().min(0).max(255),
});

export const PlayerStateSchema = z.object({
	id: PlayerId,
	x: z.number(),
	y: z.number(),
	angle: z.number(),
	alive: z.boolean(),
	gapTicksLeft: z.number().int(),
	tailSegIndex: z.number().int(),
	color: ColorRGBASchema,
});

export const SegmentSchema = z.object({
	x1: z.number(),
	y1: z.number(),
	x2: z.number(),
	y2: z.number(),
	ownerId: PlayerId,
	color: ColorRGBASchema,
	isGap: z.boolean(),
});

export const GameStateSnapshotSchema = z.object({
	phase: GamePhaseSchema,
	tick: z.number().int(),
	seed: z.number().int(),
	rngState: z.number().int().optional(),
	hostId: PlayerId,
	playerIds: z.array(PlayerId),
	sceneById: z.record(PlayerId, PlayerPhaseSchema),
	players: z.array(PlayerStateSchema),
	segments: z.array(SegmentSchema),
	roomId: RoomId,
});

export type GamePhase = z.infer<typeof GamePhaseSchema>;
export type PlayerPhase = z.infer<typeof PlayerPhaseSchema>;
export type GameStateSnapshot = z.infer<typeof GameStateSnapshotSchema>;
