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
import { RoomManager } from "../app/room_manager";
import type { TurnInput } from "../engine/step";

type PublicMsg =
	| { type: "join_room"; roomId: string; playerId: string }
	| { type: "input"; turn: TurnInput };

function safeSend(ws: WebSocket, obj: unknown) {
	if (ws.readyState === ws.OPEN)
		ws.send(JSON.stringify(obj));
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
			try {
				const msg = JSON.parse(buf.toString()) as PublicMsg;

				if (msg.type === "join_room") {
					boundRoomId = msg.roomId;
					boundPlayerId = msg.playerId;

					rooms.subscribe(boundRoomId, ws);
					safeSend(ws, { type: "joined", roomId: boundRoomId, playerId: boundPlayerId });
					return;
				}

				if (msg.type === "input") {
					if (!boundRoomId || !boundPlayerId)
						throw new Error("Must join_room first");

					rooms.pushInput({ roomId: boundRoomId, playerId: boundPlayerId, turn: msg.turn });
					return;
				}

				throw new Error("Unknown message type");
			} catch (e) {
				safeSend(ws, { type: "error", message: e instanceof Error ? e.message : String(e) });
			}
		});

		ws.on("close", () => rooms.unsubscribeAll(ws));
	});

	console.log(`public WS on ws://localhost:${opts.port}${opts.path ?? "/ws"}`);
}
