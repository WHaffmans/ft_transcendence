
import { z } from "zod";
import { RoomId, PlayerId } from "../common/primitives.js";

export const TurnInputSchema = z.union([z.literal(-1), z.literal(0), z.literal(1)]);

/**
 * =========================
 * Client → Server payload schemas
 * =========================
 */

export const CreateRoomMsgSchema = z.object({
	type: z.literal("create_room"),
	roomId: RoomId,
	seed: z.number().int(),
	config: z.unknown().optional(),
	players: z
		.array(
			z.object({
				playerId: PlayerId,
			}),
		)
		.min(1),
});

export const JoinRoomMsgSchema = z.object({
	type: z.literal("join_room"),
	roomId: RoomId,
	playerId: PlayerId,
});

export const StartGameMsgSchema = z.object({
	type: z.literal("start_game"),
	roomId: RoomId,
})

export const LeaveRoomMsgSchema = z.object({
	type: z.literal("leave_room"),
	roomId: RoomId,
	playerId: PlayerId
});

export const InputMsgSchema = z.object({
	type: z.literal("input"),
	turn: TurnInputSchema,
});

// Export message types
export const ClientMsgSchema = z.discriminatedUnion("type", [
	CreateRoomMsgSchema,
	JoinRoomMsgSchema,
	StartGameMsgSchema,
	LeaveRoomMsgSchema,
	InputMsgSchema,
]);

export type ClientMsg = z.infer<typeof ClientMsgSchema>;
export type ClientMsgType = ClientMsg["type"];
