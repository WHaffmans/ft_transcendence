
// https://zod.dev/
import { z } from "zod";
import { PROTOCOL_VERSION, TimestampMs, Seq, RoomId, PlayerId } from "../common/primitives";
import { asNonEmptyTuple, formatZodError, parseJson } from "../common/envelope";

/**
 * =========================
 * Client → Server payload schemas
 * =========================
 */

export const ClientPayloadSchemas = {
	create_room: z.object({
		roomId: RoomId,
		seed: z.number().int(),
		config: z.unknown()
	}),

	join_room: z.object({
		roomId: RoomId,
		playerId: PlayerId,
	}),

	input: z.object({
		turn: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
	}),

	leave_room: z.object({}),
} as const;


export type ClientMsgType = keyof typeof ClientPayloadSchemas;
export type ClientPayload<T extends ClientMsgType> = z.infer<(typeof ClientPayloadSchemas)[T]>;

/**
 * =========================
 * Client → Server envelope
 * =========================
 */
const ClientEnvelopeBase = z.object({
	v: z.literal(PROTOCOL_VERSION),
	type: z.string(),
	roomId: RoomId,
	seq: Seq,					// sequence number
	t: TimestampMs,
	payload: z.unknown(),
});

export const ClientMsgSchema = z.discriminatedUnion(
	"type",
	asNonEmptyTuple(
		(Object.keys(ClientPayloadSchemas) as ClientMsgType[]).map((type) =>
			ClientEnvelopeBase.extend({
				type: z.literal(type),
				payload: ClientPayloadSchemas[type],
			})
		)
	)
);

export type ClientMsg = z.infer<typeof ClientMsgSchema>;

export function parseClientMsg(raw: string): ClientMsg {
	const obj = parseJson(raw);
	const res = ClientMsgSchema.safeParse(obj);
	if (!res.success) {
		throw new Error(formatZodError(res.error));
	}
	return res.data;
}
