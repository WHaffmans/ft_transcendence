
// https://zod.dev/
import { z } from "zod";
import type { ZodIssue } from "zod";
import { RoomId, PlayerId } from "../common/primitives.js";

export const ErrorPayloadSchema = z.object({
	message: z.string(),
});

/**
 * =========================
 * Server → Client payload schemas
 * =========================
 */

export const RoomCreatedMsgSchema = z.object({
	type: z.literal("room_created"),
	roomId: RoomId,
});

export const JoinedMsgSchema = z.object({
	type: z.literal("joined"),
	roomId: RoomId,
	playerId: PlayerId,
});

export const StateMsgSchema = z.object({
	type: z.literal("state"),
	snapshot: z.unknown(),
});

export const ErrorMsgSchema = z.object({
	type: z.literal("error"),
	...ErrorPayloadSchema.shape,
});


// Export message types
export const ServerMsgSchema = z.discriminatedUnion("type", [
	RoomCreatedMsgSchema,
	JoinedMsgSchema,
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
