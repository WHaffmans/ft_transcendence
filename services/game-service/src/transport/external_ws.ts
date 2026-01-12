/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   external_ws.ts                                     :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/01/06 14:36:09 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/01/07 09:44:12 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import { WebSocketServer } from "ws";
import type WebSocket from "ws";
import type { GameConfig } from "../engine/config";
import { DEFAULT_CONFIG } from "../engine/config";
import { RoomManager } from "../app/room_manager";
import type { TurnInput } from "../engine/step";

type PublicMsg =
	| {
		type: "create_room";
		roomId: string;
		seed: number;
		config?: Partial<GameConfig>;
		players: { playerId: string }[];
	}
	| { type: "join_room"; roomId: string; playerId: string }
	| { type: "input"; turn: TurnInput };

function safeSend(ws: WebSocket, obj: unknown) {
	if (ws.readyState === ws.OPEN)
		ws.send(JSON.stringify(obj));
}

function assertNever(x: never): never {
	throw new Error(`Unhandled message: ${JSON.stringify(x)}`);
}

export function startPublicWsServer(
	opts: { port: number; path?: string },
	rooms: RoomManager
) {
	const wss = new WebSocketServer({ port: opts.port, path: opts.path ?? "/ws" });

	wss.on("connection", (ws) => {
		let boundRoomId: string | null = null;
		let boundPlayerId: string | null = null;

		ws.on("message", (buf) => {
			let msg: PublicMsg;

			// Parse JSON
			try {
				msg = JSON.parse(buf.toString()) as PublicMsg;
			} catch {
				safeSend(ws, { type: "error", message: "Invalid JSON" });
				return;
			}

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

						const config: GameConfig = {
							...DEFAULT_CONFIG,
							...(msg.config ?? {}),
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

						safeSend(ws, {
							type: "joined",
							roomId: boundRoomId,
							playerId: boundPlayerId,
						});
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
