
// https://zod.dev/
import { z } from "zod";

/**
 * Protocol version
 */
export const PROTOCOL_VERSION = 1 as const;

/**
 * Shared primitives
 */
export const RoomId = z.string().min(1).max(128);
export const PlayerId = z.string().min(1).max(128);
export const MsgType = z.string().min(1).max(64);
export const Seq = z.number().int().nonnegative();
export const TimestampMs = z.number().finite().nonnegative();
export const Tick = z.number().int().nonnegative();
