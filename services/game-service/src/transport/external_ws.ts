/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   external_ws.ts                                     :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/01/06 14:36:09 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/03/02 11:27:02 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import { WebSocketServer } from "ws";
import type WebSocket from "ws";
import type { IncomingMessage } from "http";
import type { GameConfig } from "../engine/config.js";
import { DEFAULT_CONFIG } from "../engine/config.js";
import { RoomManager } from "../app/room_manager.js";

// ---------------------
// define
// ---------------------

import {
	ClientMsgSchema,
	type ClientMsg,
	ServerMsgSchema,
	type ServerMsg,
	WS_CLOSE_AUTH_FAILURE,
	WS_CLOSE_ROOM_FULL,
	WS_CLOSE_INVALID_MSG,
} from "@ft/game-ws-protocol";

// ---------------------
// heartbeat
// ---------------------

const HEARTBEAT_INTERVAL_MS = 30_000;

/** Extends the ws WebSocket with a liveness flag for heartbeat tracking. */
interface AliveWebSocket extends WebSocket {
	isAlive: boolean;
}

// ---------------------
// helpers
// ---------------------

function safeSend(ws: WebSocket, obj: unknown) {
	if (ws.readyState === ws.OPEN)
		ws.send(JSON.stringify(obj));
}

function safeSendServer(ws: WebSocket, msg: ServerMsg) {
	if (ws.readyState !== ws.OPEN) return;
	
	const parsed = ServerMsgSchema.safeParse(msg);
	if (!parsed.success) {
		console.error("BUG: invalid ServerMsg being sent", parsed.error.format(), msg);
		return;
	}
	ws.send(JSON.stringify(parsed.data));
}

function normalizeConfig(partial: unknown): GameConfig {
	const p =
		partial && typeof partial === "object" && partial !== null
			? (partial as Partial<GameConfig>)
			: undefined;

	const config: GameConfig = {
		...DEFAULT_CONFIG,
		...(p ?? {}),
	};

	for (const [k, v] of Object.entries(config)) {
		if (typeof v === "number" && !Number.isFinite(v)) {
			throw new Error(`Invalid config: ${k} is ${v}`);
		}
	}

	return config;
}

function assertNever(x: never): never {
	throw new Error(`Unhandled message: ${JSON.stringify(x)}`);
}

// ---------------------
// server
// ---------------------

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

	// ── Heartbeat ──────────────────────────────────────────────────────────
	// Every HEARTBEAT_INTERVAL_MS, ping all clients.  If a client has not
	// responded with a pong since the last cycle, terminate the connection
	// (it is likely a zombie from a silent network drop).
	const heartbeat = setInterval(() => {
		for (const client of wss.clients) {
			const alive = client as AliveWebSocket;
			if (!alive.isAlive) {
				console.log("heartbeat: terminating unresponsive client");
				alive.terminate();
				continue;
			}
			alive.isAlive = false;
			alive.ping();
		}
	}, HEARTBEAT_INTERVAL_MS);

	wss.on("close", () => {
		clearInterval(heartbeat);
	});

	// ── Connection handler ─────────────────────────────────────────────────
	wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {

		// -- Heartbeat bookkeeping --
		const alive = ws as AliveWebSocket;
		alive.isAlive = true;
		ws.on("pong", () => { alive.isAlive = true; });

		// -- Auth: extract user id set by gateway's forwardAuth middleware --
		const headerVal = req.headers["x-user-id"];
		const authenticatedUserId: string | null =
			typeof headerVal === "string" ? headerVal
			: Array.isArray(headerVal) ? headerVal[0] ?? null
			: null;

		if (!authenticatedUserId) {
			console.warn("public WS: client connected WITHOUT X-User-Id header (direct connection or gateway misconfiguration)");
		} else {
			console.log(`public WS: client connected (userId=${authenticatedUserId})`);
		}

		let boundRoomId: string | null = null;
		let boundPlayerId: string | null = null;

		ws.on("message", (buf) => {
			let raw: unknown;

			// Parse JSON
			try {
				raw = JSON.parse(buf.toString());
			} catch {
				safeSend(ws, { type: "error", message: "Invalid JSON" });
				return;
			}

			// Validate message shape
			const parsed = ClientMsgSchema.safeParse(raw);
			if (!parsed.success) {
				safeSend(ws, { type: "error", message: "Invalid message shape" });
				return;
			}

			const msg: ClientMsg = parsed.data;

			// -- Auth: verify playerId matches the authenticated user --
			// Extract playerId from whichever field the message uses.
			const claimedPlayerId =
				"player" in msg ? String(msg.player.playerId)
				: "playerId" in msg ? String(msg.playerId)
				: null;

			if (authenticatedUserId && claimedPlayerId && claimedPlayerId !== authenticatedUserId) {
				safeSendServer(ws, {
					type: "error",
					message: "Player ID does not match authenticated user",
				} satisfies ServerMsg);
				ws.close(WS_CLOSE_AUTH_FAILURE, "Player ID mismatch");
				return;
			}

			// Handle messages
			try {
				switch (msg.type) {
					case "create_or_join_room": {

						// Check for other room subcription
						if (boundRoomId && boundRoomId !== msg.roomId) {
							try { rooms.unsubscribe(boundRoomId, ws); } catch { }
							boundRoomId = null;
							boundPlayerId = null;
						}

						const config = normalizeConfig(msg.config);
						const seed = msg.seed;

						boundRoomId = msg.roomId;
						boundPlayerId = msg.player.playerId;

						rooms.createOrJoinRoom({
							roomId: boundRoomId,
							player: msg.player,
							seed,
							config,
						}, ws);

						safeSendServer(ws, { type: "joined", roomId: boundRoomId, playerId: boundPlayerId } satisfies ServerMsg);
						return;
					}

					case "update_scene": {
						if (!boundRoomId || !boundPlayerId) {
							throw new Error("Must join_room first");
						}
						if (msg.roomId !== boundRoomId || msg.playerId !== boundPlayerId) {
							throw new Error("update_scene: room/player mismatch");
						}

						boundRoomId = msg.roomId;
						boundPlayerId = msg.playerId;

						rooms.broadcastState(boundRoomId);
						rooms.updatePlayerScene(boundRoomId, boundPlayerId, msg.scene);
						rooms.broadcastState(boundRoomId);
						rooms.willUpdateRoomPhase(boundRoomId);
						return;
					}

					case "start_game": {
						if (!boundRoomId || !boundPlayerId) {
							throw new Error("Must join_room first");
						}
						if (msg.roomId !== boundRoomId) {
							throw new Error("start_game: room mismatch");
						}

						const room = rooms.get(boundRoomId);
						if (!room) throw new Error(`Unknown roomId: ${boundRoomId}`);

						if (room.phase !== "ready") {
							throw new Error(`Room is not ready (phase=${room.phase})`);
						}

						rooms.setRoomToRunning(boundRoomId);
						rooms.broadcast(boundRoomId, { type: "game_started", roomId: boundRoomId} satisfies ServerMsg);
						rooms.startRoom(msg.roomId);
						return;
					}

					case "leave_room": {
						boundRoomId = msg.roomId;
						boundPlayerId = msg.playerId;

						rooms.onPlayerDisconnected(boundRoomId, boundPlayerId, ws, "Player exit");
						rooms.broadcast(msg.roomId, { type: "left", roomId: boundRoomId, playerId: boundPlayerId} satisfies ServerMsg);
						rooms.unsubscribe(boundRoomId, ws);

						boundRoomId = null;
						boundPlayerId = null;
						return;
					}

					case "input": {
						if (!boundRoomId || !boundPlayerId) {
							throw new Error("Must join_room first");
						}

						const room = rooms.get(boundRoomId);
						if (!room) return;

						// Reject input if not bound
						if (!rooms.isBoundSocket(boundRoomId, boundPlayerId, ws))
							return;

						rooms.pushInput({
							roomId: boundRoomId,
							playerId: boundPlayerId,
							turn: msg.turn,
						});
						return;
					}

					default:
						assertNever(msg);
				}
			} catch (e) {
				safeSend(ws, {
					type: "error",
					message: e instanceof Error ? e.message : String(e),
				});
				return;
			}
		});

		ws.on("close", (code, reason) => {
			if (boundRoomId && boundPlayerId) {
				rooms.onPlayerSocketLost(boundRoomId, boundPlayerId, ws, { code, reason: reason.toString() });
			} else {
				rooms.unsubscribeAll(ws);
			}
		});

		ws.on("error", () => {
			if (boundRoomId && boundPlayerId) {
				rooms.onPlayerSocketLost(boundRoomId, boundPlayerId, ws, {});
			} else {
				rooms.unsubscribeAll(ws);
			}
		});
	});

	console.log(`public WS on ws://localhost:${opts.port}${opts.path ?? "/ws"}`);
}
