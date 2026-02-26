
import { z } from "zod";
import type { ZodIssue } from "zod";
import { RoomId, PlayerId } from "../common/primitives.js";
import { GameStateSnapshotSchema } from "./snapshot.js";

export const ErrorPayloadSchema = z.object({
	message: z.string(),
});

/**
 * =========================
 * Server → Client payload schemas
 * =========================
 */

export const JoinedMsgSchema = z.object({
	type: z.literal("joined"),
	roomId: RoomId,
	playerId: PlayerId,
});

export const LeftMsgSchema = z.object({
	type: z.literal("left"),
	roomId: RoomId,
	playerId: PlayerId,
});

export const RoomClosedMsgSchema = z.object({
	type: z.literal("room_closed"),
	roomId: z.string(),
	reason: z.string(),
});

export const GameStartedMsgSchema = z.object({
	type: z.literal("game_started"),
	roomId: RoomId,
});

export const GameFinishedMsgSchema = z.object({
	type: z.literal("game_finished"),
	roomId: RoomId,
	winnerId: PlayerId.nullable(),
});

const LobbyTimerMsgSchema = z.object({
	type: z.literal("lobby_timer"),
	roomId: z.string(),
	secondsLeft: z.number().int().min(0),
	deadlineAtMs: z.number().int().nonnegative(),
});

export const StateMsgSchema = z.object({
	type: z.literal("state"),
	snapshot: GameStateSnapshotSchema,
});

export const ErrorMsgSchema = z.object({
	type: z.literal("error"),
	...ErrorPayloadSchema.shape,
});

export const ServerMsgSchema = z.discriminatedUnion("type", [
	JoinedMsgSchema,
	LeftMsgSchema,
	RoomClosedMsgSchema,
	GameStartedMsgSchema,
	GameFinishedMsgSchema,
	LobbyTimerMsgSchema,
	StateMsgSchema,
	ErrorMsgSchema,
]);

export type ServerMsg = z.infer<typeof ServerMsgSchema>;
export type ServerMsgType = ServerMsg["type"];

export function parseServerMsg(raw: string): ServerMsg {
	let obj: unknown;
	try {
		obj = JSON.parse(raw);
	} catch {
		throw new Error("Invalid JSON");
	}

	const res = ServerMsgSchema.safeParse(obj);
	if (!res.success) {
		throw new Error(res.error.issues.map((i: ZodIssue) => i.message).join("; "));
	}
	return res.data;
}
