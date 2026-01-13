
// https://zod.dev/
import { z } from "zod";

export const ErrorPayloadSchema = z.object({
	code: z.string().min(1).max(64),
	message: z.string().min(1).max(500),
});

export type ErrorPayload = z.infer<typeof ErrorPayloadSchema>;
