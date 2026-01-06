/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   internal_ws.ts                                     :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/01/06 14:36:06 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/01/06 16:40:24 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import { WebSocketServer } from "ws";
import type WebSocket from "ws";
import { RoomManager } from "../app/room_manager";
import type { GameConfig } from "../engine/config";
import { DEFAULT_CONFIG } from "../engine/config";
import type { TurnInput } from "../engine/step";

type InternalMsg =
	| {
		type: "create_room";
		roomId: string;
		seed: number;
		config?: Partial<GameConfig>;
		players: { playerId: string }[];
	}
	| {
		type: "input";
    	roomId: string;
    	playerId: string;
    	turn: TurnInput;
    	clientTick?: number;
    	seq?: number;
    }
	| {
    	type: "close_room";
    	roomId: string;
    	reason?: string;
    };

function safeSend(ws: WebSocket, obj: unknown) {
	if (ws.readyState === ws.OPEN)
		ws.send(JSON.stringify(obj));
}

function parseMsg(raw: string): InternalMsg {
	const data = JSON.parse(raw) as any;
	if (!data || typeof data !== "object")
		throw new Error("Invalid JSON");

	if (typeof data.type !== "string")
		throw new Error("Missing type");

	if (typeof data.roomId !== "string" && data.type !== "create_room") {
    	// TODO: Create Room
	}

  return (data as InternalMsg);
}

export function startInternalWsServer(opts: { port: number; path?: string }, rooms: RoomManager) {
	const wss = new WebSocketServer({ port: opts.port, path: opts.path ?? "/internal" });

	wss.on("connection", (ws) => {
		ws.on("message", (buf) => {
			try {
        		const msg = parseMsg(buf.toString());

        		switch (msg.type) {

					// Create
          			case "create_room": {
            			const playerIds = msg.players.map((p) => p.playerId);

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

						// Subscribe this backend connection to state updates for this room
						rooms.subscribe(msg.roomId, ws);

            			safeSend(ws, { type: "room_created", roomId: msg.roomId });
            			break;
          			}

					// Input
					case "input": {
						rooms.pushInput({ roomId: msg.roomId, playerId: msg.playerId, turn: msg.turn });
						break;
					}

					// Close
					case "close_room": {
						rooms.closeRoom(msg.roomId, msg.reason);
						break;
					}
        		}
			} catch (e) {
				safeSend(ws, { type: "error", message: e instanceof Error ? e.message : String(e) });
			}
    	});

		ws.on("close", () => {
			rooms.unsubscribeAll(ws);
		});
	});

	console.log(`game-service internal WS on ws://localhost:${opts.port}${opts.path ?? "/internal"}`);
	return (wss);
}
