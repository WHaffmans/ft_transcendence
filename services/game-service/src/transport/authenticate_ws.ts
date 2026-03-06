/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   authenticate_ws.ts                                 :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/03/06 09:07:36 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/03/06 10:48:44 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import type WebSocket from "ws";
import type { IncomingMessage } from "http";

import { safeSendServer } from "./send_ws.js";

import {
	type ClientMsg,
	type ServerMsg,
	WS_CLOSE_AUTH_FAILURE,
} from "@ft/game-ws-protocol";

function getClaimedPlayerId(msg: ClientMsg): string | null {
	return "player" in msg ? String(msg.player.playerId)
		: "playerId" in msg ? String(msg.playerId)
		: null;
}

function isAuthenticatedPlayerMatch(
	authenticatedUserId: string | null,
	playerId: string | null,
): boolean {
	if (!authenticatedUserId || !playerId)
		return (true);
	return (playerId === authenticatedUserId);
}

function closeForAuthFailure(ws: WebSocket, authenticatedUserId: string, claimedPlayerId: string) {
	console.warn("[ws:transport] auth mismatch — closing", {
		authenticatedUserId,
		claimedPlayerId,
	});

	safeSendServer(ws, {
		type: "error",
		message: "Player ID does not match authenticated user",
	} satisfies ServerMsg);

	ws.close(WS_CLOSE_AUTH_FAILURE, "Player ID mismatch");
}

export function getAuthenticatedUserId(req: IncomingMessage): string | null {
	const headerVal = req.headers["x-user-id"];

	const authenticatedUserId: string | null =
		typeof headerVal === "string" ? headerVal
		: Array.isArray(headerVal) ? headerVal[0] ?? null
		: null;

	if (!authenticatedUserId) {
		console.warn(
			"public WS: client connected WITHOUT X-User-Id header (direct connection or gateway misconfiguration)"
		);
	} else {
		console.log(`public WS: client connected (userId=${authenticatedUserId})`);
	}

	return (authenticatedUserId);
}

export function verifyClaimedPlayerAuth(
	ws: WebSocket,
	authenticatedUserId: string | null,
	msg: ClientMsg,
): boolean {
	const claimedPlayerId = getClaimedPlayerId(msg);

	if (
		authenticatedUserId &&
		claimedPlayerId &&
		!isAuthenticatedPlayerMatch(authenticatedUserId, claimedPlayerId)
	) {
		closeForAuthFailure(ws, authenticatedUserId, claimedPlayerId);
		return (false);
	}

	return (true);
}
