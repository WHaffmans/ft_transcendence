/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   ws_server.ts                                       :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/01/06 14:36:09 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/03/09 13:54:19 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import { WebSocketServer } from "ws";
import type WebSocket from "ws";
import type { IncomingMessage } from "http";
import { RoomManager } from "../app/room_manager.js";
import { safeSendServer } from "./ws_helpers/ws_send.js";
import { WsContext } from "./ws_helpers/ws_types.js";

import {
	getAuthenticatedUserId,
	verifyClaimedPlayerAuth,
} from "./ws_helpers/ws_authenticate.js";

import {
	handleCreateOrJoinRoom,
	handleUpdateScene,
	handleStartGame,
	handleLeaveRoom,
	handleInput,
} from "./ws_helpers/ws_handlers.js";

import {
	ClientMsgSchema,
	type ClientMsg,
} from "@ft/game-ws-protocol";


/* ====================================================================== */
/*                              DEFINE                                    */
/* ====================================================================== */

const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Extends the ws WebSocket with a liveness flag for heartbeat tracking.
 */
interface AliveWebSocket extends WebSocket {
	isAlive: boolean;
}


/* ====================================================================== */
/*                              HELPERS                                   */
/* ====================================================================== */

function assertNever(x: never): never {
    throw new Error(`Unhandled message: ${JSON.stringify(x)}`);
}


/* ====================================================================== */
/*                              HEARTBEAT                                 */
/* ====================================================================== */

function attachHeartbeat(ws: WebSocket) {
	const alive = ws as AliveWebSocket;
	alive.isAlive = true;

	ws.on("pong", () => {
		alive.isAlive = true;
	});
}

/**
 * Heartbeat
 * `ping` all client HEARTBEAT_INTERVAL_MS. Close connection if client
 * does not respond with `pong`. Avoid zombie from silent network drop.
 */
function startHeartbeat(wss: WebSocketServer) {
	const interval = setInterval(() => {
		for (const client of wss.clients) {
			const alive = client as AliveWebSocket;

			if (!alive.isAlive) {
				alive.terminate();
				continue;
			}

			alive.isAlive = false;
			alive.ping();
		}
	}, HEARTBEAT_INTERVAL_MS);

	wss.on("close", () => {
		clearInterval(interval);
	});

	return (interval);
}


/* ====================================================================== */
/*                              SERVER                                    */
/* ====================================================================== */

export function startPublicWsServer(
	opts: { port: number; path?: string; server?: any },
	rooms: RoomManager
) {
	const wsOptions: any = {
		path: opts.path ?? "/ws",
	};

	// If an HTTPS server is provided, attach to it; otherwise create standalone WebSocket server
	if (opts.server) {
		wsOptions.server = opts.server;
	} else {
		wsOptions.host = "0.0.0.0";
		wsOptions.port = opts.port;
	}

	const wss: WebSocketServer = new WebSocketServer(wsOptions);
	startHeartbeat(wss);

	wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {

		// Heartbeat bookkeeping
		attachHeartbeat(ws);

		// Get auth from request header
		const authenticatedUserId = getAuthenticatedUserId(req);

		let boundRoomId: string | null = null;
		let boundPlayerId: string | null = null;

		ws.on("message", (buf) => {
			let raw: unknown;

			// Parse JSON
			try {
				raw = JSON.parse(buf.toString());
			} catch {
				safeSendServer(ws, { type: "error", message: "Invalid JSON" });
				return;
			}

			// Validate message shape
			const parsed = ClientMsgSchema.safeParse(raw);
			if (!parsed.success) {
				safeSendServer(ws, { type: "error", message: "Invalid message shape" });
				return;
			}

			const msg: ClientMsg = parsed.data;

			// Authenticate user
			if (!verifyClaimedPlayerAuth(ws, authenticatedUserId, msg))
				return;

			const ctx: WsContext = {
				ws,
				req,
				rooms,
				authenticatedUserId,
				getBound: () => ({ roomId: boundRoomId, playerId: boundPlayerId }),
				setBound: (roomId, playerId) => { boundRoomId = roomId; boundPlayerId = playerId; },
			};

			console.log("[ws:transport] incoming message", {
				type: msg.type,
				boundRoomId,
				authenticatedUserId,
			});
			
			// Handle messages
			try {
				switch (msg.type) {
					case "create_or_join_room":
						return (handleCreateOrJoinRoom(ctx, msg));
					case "update_scene":
						return (handleUpdateScene(ctx, msg));
					case "start_game":
						return (handleStartGame(ctx, msg));
					case "leave_room":
						return (handleLeaveRoom(ctx, msg));
					case "input":
						return (handleInput(ctx, msg));
					default:
						assertNever(msg);
				}
			} catch (e) {
				console.error("[ws:transport] message handling error", { type: msg.type, error: e instanceof Error ? e.message : String(e) });
				safeSendServer(ws, {
					type: "error",
					message: e instanceof Error ? e.message : String(e),
				});
				return;
			}
		});

		ws.on("close", (code, reason) => {
			console.log(`[ws:transport] close code=${code} reason="${reason.toString()}"`, { boundRoomId, boundPlayerId });
			if (boundRoomId && boundPlayerId) {
				rooms.onPlayerSocketLost(boundRoomId, boundPlayerId, ws, { code, reason: reason.toString() });
			} else {
				rooms.unsubscribeAll(ws);
			}
		});

		ws.on("error", (err) => {
			console.error("[ws:transport] error", { boundRoomId, boundPlayerId, error: String(err) });
			if (boundRoomId && boundPlayerId) {
				rooms.onPlayerSocketLost(boundRoomId, boundPlayerId, ws, {});
			} else {
				rooms.unsubscribeAll(ws);
			}
		});
	});
}
