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
import { ServerMsgSchema, type ServerMsg } from "@ft/game-ws-protocol";

export type GamePhase = "lobby" | "ready" | "running" | "finished";
type Scene = "lobby" | "game";

type Room = {
	phase: GamePhase;
	roomId: string;
	seed: number;
	config: GameConfig;
	state: GameState;

	playerIds: string[];
	sceneById: Record<string, Scene>;


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
function safeSend(ws: WebSocket, msg: unknown) {
	if (ws.readyState !== ws.OPEN)
		return;
	
	const parsed = ServerMsgSchema.safeParse(msg);
	
	if (!parsed.success) {
		console.error("GameEngine: invalid ServerMsg issues:", parsed.error.issues);
		console.error("GameEngine: invalid ServerMsg formatted:", parsed.error.format());
		console.error("GameEngine: invalid ServerMsg msg:", msg);
		return;
	}

	ws.send(JSON.stringify(parsed.data));
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
			throw new Error(`Room already exists: ${roomId}`);
		}

		// Init game / player start positions
		const state = initGame(config, seed, playerIds);

		// Flush player inputs
		const inputsById: Record<string, TurnInput> = {};
		for (const id of playerIds) inputsById[id] = 0;

		// Init players
		const sceneById: Record<string, Scene> = {};
		for (const id of playerIds) sceneById[id] = "lobby";
	
		// Add room
		const room: Room = {
			phase: "lobby",
			roomId,
			seed,
			config,
			state,
			playerIds,
			sceneById,
			inputsById,
			subscribers: new Set(),
		};

		this.rooms.set(roomId, room);
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
	 * Add a player to the room
	 */
	addPlayerToRoom(roomId: string, playerId: string) {
		const room = this.rooms.get(roomId);
		if (!room) throw new Error(`Unknown roomId: ${roomId}`);

		if (room.phase === "finished") {
			throw new Error(`Room ${roomId} is finished`);
		}

		if (!room.playerIds.includes(playerId)) {
			room.playerIds.push(playerId);
		}

		if (!(playerId in room.inputsById)) room.inputsById[playerId] = 0;
		if (!(playerId in room.sceneById)) room.sceneById[playerId] = "lobby";

		this.resetGame(room);
		this.broadcastState(roomId);
	}

	/**
	 * Update the scene for a player
	 */
	updatePlayerScene(roomId: string, playerId: string, scene: Scene ) {
		const room = this.rooms.get(roomId);
		if (!room)
			throw new Error(`Unknown roomId: ${roomId}`);

		if (!room.playerIds.includes(playerId))
			throw new Error(`Unknown playerId ${playerId} for room ${roomId}`);

		if (room.sceneById[playerId] === scene)
			return;

		room.sceneById[playerId] = scene;
	}

	/**
	 * Set room to ready when all players have entered game
	 * lobby -> ready
	 */
	willUpdateRoomPhase(roomId: string) {
		const room = this.rooms.get(roomId);
		if (!room)
			throw new Error(`Unknown roomId: ${roomId}`);


		console.log("phase check", {
			phase: room.phase,
			playerIds: room.playerIds,
			sceneById: room.sceneById,
			allOnGameCanvas: room.playerIds.every((id) => room.sceneById[id] === "game"),
		});

		if (room.phase !== "lobby")
			return;

		const allOnGameCanvas = room.playerIds.every((id) => room.sceneById[id] === "game");
		if (!allOnGameCanvas)
			return;

		room.phase = "ready";

		console.log("Room state set to: ready");
		this.broadcast(roomId, {
			type: "state",
			snapshot: this.makeSnapshot(room),
		} satisfies ServerMsg);
	}

	setRoomToRunning(roomId: string) {
		const room = this.rooms.get(roomId);
		if (!room)
			throw new Error(`Unknown roomId: ${roomId}`);

		if (room.phase !== "ready")
			return;

		room.phase = "running";

		console.log("Room state set to: running");
		this.broadcast(roomId, {
			type: "state",
			snapshot: this.makeSnapshot(room),
		} satisfies ServerMsg);
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

	broadcast(roomId: string, msg: ServerMsg) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		for (const ws of room.subscribers) {
			safeSend(ws, msg);
		}
	}

	broadcastState(roomId: string) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		this.broadcast(roomId, {
			type: "state",
			snapshot: this.makeSnapshot(room),
		} satisfies ServerMsg);
	}

	private makeSnapshot(room: Room) {
		return {
			phase: room.phase,
			tick: room.state.tick,
			seed: room.state.seed,
			rngState: room.state.rngState,

			players: room.state.players.map((p) => ({
				id: p.id,
				x: p.x,
				y: p.y,
				angle: p.angle,
				alive: p.alive,
				gapTicksLeft: Number.isInteger(p.gapTicksLeft) ? p.gapTicksLeft : Math.trunc(p.gapTicksLeft),
				tailSegIndex: Number.isInteger(p.tailSegIndex) ? p.tailSegIndex : Math.trunc(p.tailSegIndex),
				color: p.color,
			})),

			segments: room.state.segments.map((s) => ({
				x1: s.x1,
				y1: s.y1,
				x2: s.x2,
				y2: s.y2,
				ownerId: s.ownerId,
				color: s.color,
				isGap: s.isGap,
			})),

			roomId: room.roomId,
		};
	}

	private resetGame(room: Room) {
		room.state = initGame(room.config, room.seed, room.playerIds);

		const inputsById: Record<string, TurnInput> = {};
		for (const id of room.playerIds) inputsById[id] = 0;
		room.inputsById = inputsById;
	}

	/**
	 * Start game loop
	 */
	startLoop(roomId: string) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		if (room.timer)
			return;

		const tickRate = room.config.tickRate;
		const dtMs = Math.round(1000 / tickRate);

		room.timer = setInterval(() => {
			if (room.phase === "running") {
				const inputsSnapshot = { ...room.inputsById };
				room.state = step(room.state, inputsSnapshot, room.config);
			}

			const msg = {
				type: "state",
				snapshot: this.makeSnapshot(room),
			} satisfies ServerMsg;

			for (const ws of room.subscribers)
				safeSend(ws, msg);
		}, dtMs);
	}
	
};
