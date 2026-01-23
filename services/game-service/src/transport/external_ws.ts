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
import type { TurnInput } from "../engine/step";

// Shared protocol
import {
	ClientMsgSchema,
	type ClientMsg
} from "@ft/game-ws-protocol";

// ---------------------
// helpers
// ---------------------

function safeSend(ws: WebSocket, obj: unknown) {
	if (ws.readyState === ws.OPEN)
		ws.send(JSON.stringify(obj));
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
	const wss : WebSocketServer = new WebSocketServer({ port: opts.port, path: opts.path ?? "/ws" });

	wss.on("connection", (ws) => {
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

						// Subscribe this socket
						rooms.subscribe(msg.roomId, ws);

						safeSend(ws, { type: "room_created", roomId: msg.roomId });
						return;
					}

					case "join_room": {
						boundRoomId = msg.roomId;
						boundPlayerId = msg.playerId;

						rooms.subscribe(boundRoomId, ws);

						console.log(`Player ${boundPlayerId} joined room ${boundRoomId}`);

						rooms.broadcast(boundRoomId, { type: "joined", roomId: boundRoomId, playerId: boundPlayerId });
						// safeSend(ws, {
						// 	type: "joined",
						// 	roomId: boundRoomId,
						// 	playerId: boundPlayerId,
						// });
						return;
					}

					case "leave_room": {
						console.log(`Player left room ${msg.roomId}`);
						rooms.broadcast(msg.roomId, { type: "left", roomId: msg.roomId});
						rooms.unsubscribe(msg.roomId, ws);

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
