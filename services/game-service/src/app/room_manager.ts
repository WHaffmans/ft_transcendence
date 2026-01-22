/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   room_manager.ts                                    :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/01/06 14:35:21 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/01/20 15:39:51 by qmennen       ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import type WebSocket from "ws";

import { initGame } from "../engine/init";
import type { GameState } from "../engine/init";
import type { GameConfig } from "../engine/config";
import { step } from "../engine/step";
import type { TurnInput } from "../engine/step";

type Room = {
	roomId: string;
	seed: number;
	config: GameConfig;
	state: GameState;

	// Latest inputs per player
	inputsById: Record<string, TurnInput>;

	// Handle ticks
	timer?: NodeJS.Timeout;

	// Internal subscribers
	subscribers: Set<WebSocket>;
};


/**
 * Send obj to open web socket
 */
function safeSend(ws: WebSocket, obj: unknown) {
	if (ws.readyState === ws.OPEN)
		ws.send(JSON.stringify(obj));
}

export class RoomManager {
	private rooms = new Map<string, Room>();

	/**
	 * Search for a room
	 */
	get(roomId: string) {
		return (this.rooms.get(roomId));
	}

	/**
	 * Create a new room
	 */
	createRoom(args: {
		roomId: string;
		seed: number;
		config: GameConfig;
		playerIds: string[];
	}) {
		const { roomId, seed, config, playerIds } = args;

		// Check if room exists
		if (this.rooms.has(roomId)) {
			throw new Error('Room already exists: ${roomId}');
		}

		// Init game / player start positions
		const state = initGame(config, seed, playerIds);

		// Flush player inputs
		const inputsById: Record<string, TurnInput> = {};
		for (const id of playerIds) inputsById[id] = 0;
	
		// Add room
		const room: Room = {
			roomId,
			seed,
			config,
			state,
			inputsById,
			subscribers: new Set(),
		};

		this.rooms.set(roomId, room);
		// this.startLoop(roomId, config.tickRate);
	};

	/**
	 * Add a new web socket to list of subscribers
	 */
	subscribe(roomId: string, ws: WebSocket) {
		const room = this.rooms.get(roomId);
		if (!room)
			throw new Error(`Unknown roomId: ${roomId}`);
		room.subscribers.add(ws);
	}

	/**
	 * Remove a web socket from list of subscribers
	 */
	unsubscribe(roomId: string, ws: WebSocket) {
		const room = this.rooms.get(roomId);
		if (!room)
			throw new Error(`Unknown roomId: ${roomId}`);
		room.subscribers.delete(ws);
	}

	unsubscribeAll(ws: WebSocket) {
		for (const room of this.rooms.values())
			room.subscribers.delete(ws);
	}

	/**
	 * Sets inputs for each player
	 */
	pushInput(args: { roomId: string; playerId: string; turn: TurnInput }) {
		const { roomId, playerId, turn } = args;
		
		const room = this.rooms.get(roomId);
		if (!room) throw new Error(`Unknown roomId: ${roomId}`);

		if (!(playerId in room.inputsById)) {
			throw new Error(`Unknown playerId ${playerId} for room ${roomId}`);
    	}
    	
		room.inputsById[playerId] = turn;
	}

	/**
	 * Close current room
	 */
	closeRoom(roomId: string, reason = "closed") {
		const room = this.rooms.get(roomId);
		if (!room) return;

		if (room.timer)
			clearInterval(room.timer);

		for (const ws of room.subscribers) {
			safeSend(ws, { type: "room_closed", roomId, reason });
		}

		this.rooms.delete(roomId);
	}

	broadcast(roomId: string, msg: unknown) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		for (const ws of room.subscribers) {
			safeSend(ws, msg);
		}
	}

	/**
	 * Start game loop
	 */
	private startLoop(roomId: string, tickHz: number) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		const dtMs = Math.round(1000 / tickHz);

		room.timer = setInterval(() => {
			
			const inputsSnapshot = { ...room.inputsById };

			room.state = step(room.state, inputsSnapshot, room.config);

			const msg = {
				type: "State",
				roomId: room.roomId,
				tick: (room.state as any).tick,
				players: (room.state as any).players,
				segments: (room.state as any).segments,
			};

			for (const ws of room.subscribers)
				safeSend(ws, msg);

		}, dtMs);
	}

};
