// packages/protocol/src/schemas.ts
import { z } from "zod";

/**
 * Protocol version
 */
export const PROTOCOL_VERSION = 1 as const;

/**
 * Shared primitives
 */
const RoomId = z.string().min(1).max(128);
const PlayerId = z.string().min(1).max(128);
const MsgType = z.string().min(1).max(64);
const Seq = z.number().int().nonnegative();
const TimestampMs = z.number().finite().nonnegative();
const Tick = z.number().int().nonnegative();

/**
 * =========================
 * Payload schemas
 * =========================
*/

export const ClientPayloadSchemas = {
  join_room: z.object({
    playerId: PlayerId,
  }),

  input: z.object({
    turn: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  }),

  leave_room: z.object({}),
} as const;

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

  error: z.object({
    code: z.string().min(1).max(64),
    message: z.string().min(1).max(500),
  }),
} as const;

/**
 * Infer union types for TS
 */
export type ClientMsgType = keyof typeof ClientPayloadSchemas;
export type ServerMsgType = keyof typeof ServerPayloadSchemas;

export type ClientPayload<T extends ClientMsgType> = z.infer<(typeof ClientPayloadSchemas)[T]>;
export type ServerPayload<T extends ServerMsgType> = z.infer<(typeof ServerPayloadSchemas)[T]>;

/**
 * =========================
 * Envelope schemas
 * =========================
 */

const ClientEnvelopeBase = z.object({
  v: z.literal(PROTOCOL_VERSION),
  type: MsgType,
  roomId: RoomId,
  seq: Seq,
  t: TimestampMs,
  payload: z.unknown(),
});

const ServerEnvelopeBase = z.object({
  v: z.literal(PROTOCOL_VERSION),
  type: MsgType,
  roomId: RoomId,
  serverTick: Tick,
  ackSeq: Seq.optional(),
  payload: z.unknown(),
});

/**
 * Build discriminated unions where payload validation depends on `type`.
 * This yields: { type: "input", payload: {turn:...}, ... } etc.
 */
export const ClientMsgSchema = z.discriminatedUnion(
  "type",
  (Object.keys(ClientPayloadSchemas) as ClientMsgType[]).map((type) =>
    ClientEnvelopeBase.extend({
      type: z.literal(type),
      payload: ClientPayloadSchemas[type],
    })
  )
);

export const ServerMsgSchema = z.discriminatedUnion(
  "type",
  (Object.keys(ServerPayloadSchemas) as ServerMsgType[]).map((type) =>
    ServerEnvelopeBase.extend({
      type: z.literal(type),
      payload: ServerPayloadSchemas[type],
    })
  )
);

export type ClientMsg = z.infer<typeof ClientMsgSchema>;
export type ServerMsg = z.infer<typeof ServerMsgSchema>;

/**
 * =========================
 * Parsing helpers
 * =========================
 */

export function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON");
  }
}

export function parseClientMsg(raw: string): ClientMsg {
  const obj = parseJson(raw);
  const res = ClientMsgSchema.safeParse(obj);
  if (!res.success) {
    throw new Error(formatZodError(res.error));
  }
  return res.data;
}

export function parseServerMsg(raw: string): ServerMsg {
  const obj = parseJson(raw);
  const res = ServerMsgSchema.safeParse(obj);
  if (!res.success) {
    throw new Error(formatZodError(res.error));
  }
  return res.data;
}

function formatZodError(err: z.ZodError): string {
  const first = err.issues[0];
  const path = first?.path?.length ? first.path.join(".") : "(root)";
  const msg = first?.message ?? "Invalid message";
  return `${path}: ${msg}`;
}
