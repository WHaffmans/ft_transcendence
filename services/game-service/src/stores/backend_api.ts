/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   backend_api.ts                                     :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/02/09 13:17:37 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/02/10 10:35:10 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */


function requiredEnv(name: string): string {
	const v = process.env[name];
	if (!v) throw new Error(`Missing env: ${name}`);
	return (v);
}

type BackendFetchOpts = {
	method?: string;
	path: string;
	body?: unknown;
};

function safeJsonParse(text: string): unknown | null {
	try { return JSON.parse(text); } catch { return null; }
}

export async function backendFetch<T>({ method = "GET", path, body }: BackendFetchOpts): Promise<T> {
	const baseUrl = requiredEnv("BACKEND_INTERNAL_BASE_URL");
	const token = requiredEnv("BACKEND_INTERNAL_API_KEY");

	const canHaveBody = method !== "GET" && method !== "HEAD";

	const init: RequestInit = {
	method,
	headers: {
		Accept: "application/json",
		"Content-Type": "application/json",
		"X-Internal-Api-Key": token,
	},
	...(canHaveBody && body !== undefined ? { body: JSON.stringify(body) } : {}),
	};


	const res = await fetch(`${baseUrl}${path}`, init);
	const raw = await res.text();

	if (!res.ok) {
		const maybeJson = safeJsonParse(raw);
		const details = maybeJson ? JSON.stringify(maybeJson) : raw;
		throw new Error(`backend-service ${res.status} ${res.statusText} on ${path}: ${details.slice(0, 2000)}`);
	}

	// 204 No Content
	if (res.status === 204 || raw.trim() === "") return undefined as unknown as T;

	// Prefer JSON
	const parsed = safeJsonParse(raw);
	if (parsed === null) {
		throw new Error(`backend-service expected JSON on ${path} but got: ${raw.slice(0, 500)}`);
	}

	return (parsed as T);
}

export async function finishGame(roomId: string, payload: unknown) {
	return backendFetch<void>({
		method: "POST",
		path: `/games/${roomId}/finish`,
		body: payload,
	});
}
