// https://zod.dev/
import { z } from "zod";
import { PROTOCOL_VERSION, RoomId, PlayerId, Seq, Tick } from "../common/primitives";
import { asNonEmptyTuple, formatZodError, parseJson } from "../common/envelope";
import { ErrorPayloadSchema } from "../common/errors";

/**
 * =========================
 * Server → Client payload schemas
 * =========================
 */
export const ServerPayloadSchemas = {
	joined: z.object({
		playerId: PlayerId,
		seed: z.number().int(),
		config: z.unknown(),
		snapshot: z.unknown(),
	}),

	state: z.object({
		snapshot: z.unknown(),
	}),

	error: ErrorPayloadSchema,
} as const;

export type ServerMsgType = keyof typeof ServerPayloadSchemas;
export type ServerPayload<T extends ServerMsgType> = z.infer<(typeof ServerPayloadSchemas)[T]>;

/**
 * =========================
 * Server → Client envelope
 * =========================
 */
const ServerEnvelopeBase = z.object({
	v: z.literal(PROTOCOL_VERSION),
	type: z.string(),
	roomId: RoomId,
	serverTick: Tick,
	ackSeq: Seq.optional(),		// acknowladged sequence
	payload: z.unknown(),
});

export const ServerMsgSchema = z.discriminatedUnion(
	"type",
	asNonEmptyTuple(
		(Object.keys(ServerPayloadSchemas) as ServerMsgType[]).map((type) =>
			ServerEnvelopeBase.extend({
				type: z.literal(type),
				payload: ServerPayloadSchemas[type],
			})
		)
	)
);

export type ServerMsg = z.infer<typeof ServerMsgSchema>;

export function parseServerMsg(raw: string): ServerMsg {
	const obj = parseJson(raw);
	const res = ServerMsgSchema.safeParse(obj);
	if (!res.success) {
		throw new Error(formatZodError(res.error));
	}
	return res.data;
}
