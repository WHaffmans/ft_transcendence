/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   external_ws.ts                                     :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/01/06 14:36:09 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/01/16 10:15:43 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import { WebSocketServer } from "ws";
import type WebSocket from "ws";
import type { GameConfig } from "../engine/config";
import { DEFAULT_CONFIG } from "../engine/config";
import { RoomManager } from "../app/room_manager";

// ---------------------
// define
// ---------------------

import {
	ClientMsgSchema,
	type ClientMsg,
	ServerMsgSchema,
	type ServerMsg
} from "@ft/game-ws-protocol";

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

function assertNever(x: never): never {
	throw new Error(`Unhandled message: ${JSON.stringify(x)}`);
}

// ---------------------
// server
// ---------------------

export function startPublicWsServer(
	opts: { port: number; path?: string },
	rooms: RoomManager
) {
	const wss: WebSocketServer = new WebSocketServer({
		host: "0.0.0.0",
		port: opts.port,
		path: opts.path ?? "/ws",
	});

	wss.on("connection", (ws) => {
		console.log("public WS: client connected");

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

			console.log("IN", {
				type: msg.type,
				roomId: "roomId" in msg ? msg.roomId : undefined,
				playerId: "playerId" in msg ? msg.playerId : undefined,
			});

			// Handle messages
			try {
				switch (msg.type) {
					case "create_room": {
						
						// Check already joined
						if (boundRoomId || boundPlayerId) {
							throw new Error("Already joined a room; open a new socket to create a new room");
						}

						const playerIds = msg.players.map((p) => p.playerId);
						if (playerIds.length === 0) {
							throw new Error("create_room: players must not be empty");
						}

						// Partial GameConfig
						const partial = msg.config && typeof msg.config === "object" && msg.config !== null
							? (msg.config as Partial<GameConfig>)
							: undefined;

						const config: GameConfig = {
							...DEFAULT_CONFIG,
							...(partial ?? {}),
						};

						for (const [k, v] of Object.entries(config)) {
							if (typeof v === "number" && !Number.isFinite(v)) {
								throw new Error(`Invalid config: ${k} is ${v}`);
							}
						}

						rooms.createRoom({
							roomId: msg.roomId,
							seed: msg.seed,
							config,
							playerIds,
						});

						rooms.subscribe(msg.roomId, ws);
						console.log(`Room ${msg.roomId} created with players: ${playerIds.join(",")}`);
						safeSendServer(ws, { type: "room_created", roomId: msg.roomId });
						return;
					}

					case "join_room": {
						if (boundRoomId || boundPlayerId) {
							throw new Error("Already joined a room on this socket");
						}

						boundRoomId = msg.roomId;
						boundPlayerId = msg.playerId;

						rooms.addPlayerToRoom(boundRoomId, boundPlayerId);
						rooms.subscribe(boundRoomId, ws);
						console.log(`Player ${boundPlayerId} joined room ${boundRoomId}`);
						rooms.broadcast(boundRoomId, { type: "joined", roomId: boundRoomId, playerId: boundPlayerId } satisfies ServerMsg);
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
						console.log(`Player ${boundPlayerId} entered scene ${msg.scene}`);
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

						console.log(`Room ${boundRoomId} has started`);
						rooms.setRoomToRunning(boundRoomId);
						rooms.broadcast(boundRoomId, { type: "game_started", roomId: boundRoomId} satisfies ServerMsg);
						rooms.startLoop(msg.roomId);
						return;
					}

					case "start": {
						const room = rooms.get(msg.roomId);
						if (!room) {
							throw new Error(`Room not found: ${msg.roomId}: all rooms: ${[...rooms.rooms.keys()].join(", ")}`);
						}

						rooms.startRoom(msg.roomId);

						console.log(`Room started: ${msg.roomId}`);

						rooms.broadcast(msg.roomId, { type: "started", roomId: msg.roomId });
						return;
					}

					case "leave_room": {
						boundRoomId = msg.roomId;
						boundPlayerId = msg.playerId;

						console.log(`Player ${boundPlayerId} left room ${boundRoomId}`);
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

		ws.on("close", () => rooms.unsubscribeAll(ws));
	});

	console.log(`public WS on ws://localhost:${opts.port}${opts.path ?? "/ws"}`);
}
