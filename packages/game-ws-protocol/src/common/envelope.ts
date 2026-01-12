
// https://zod.dev/
import type { z } from "zod";

export function parseJson(raw: string): unknown {
	try {
		return JSON.parse(raw);
	} catch {
		throw new Error("Invalid JSON");
	}
}

export function formatZodError(err: z.ZodError): string {
	const first = err.issues[0];
	const path = first?.path?.length ? first.path.join(".") : "(root)";
	const msg = first?.message ?? "Invalid message";
	return `${path}: ${msg}`;
}

/**
 * z.discriminatedUnion requires a non-empty tuple.
 */
export function asNonEmptyTuple<T>(arr: T[]): [T, ...T[]] {
	if (arr.length === 0) throw new Error("Expected non-empty array");
	return arr as [T, ...T[]];
}
