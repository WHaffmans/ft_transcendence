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
import type { GamePhase, PlayerPhase } from "@ft/game-ws-protocol";


type Room = {
	phase: GamePhase;
	roomId: string;
	seed: number;
	config: GameConfig;
	state: GameState;

	// Players
	hostId: string;
	playerIds: string[];
	sceneById: Record<string, PlayerPhase>;
	inputsById: Record<string, TurnInput>;

	// Handle ticks
	timer?: NodeJS.Timeout | null;

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
		logError("safeSend.invalid_server_msg", {
			issues: parsed.error.issues,
			formatted: parsed.error.format(),
			msg,
		});
		return;
	}

	ws.send(JSON.stringify(parsed.data));
}

function logInfo(event: string, meta?: Record<string, unknown>) {
	console.log(`[room_manager] ${event}`, meta ?? "");
}

function logError(event: string, meta?: Record<string, unknown>) {
	console.error(`[room_manager] ${event}`, meta ?? "");
}


export class RoomManager {
	public rooms = new Map<string, Room>();


	/* ====================================================================== */
	/*                              ROOM LIFECYCLE                            */
	/* ====================================================================== */

	/**
	 * Search for a room
	 */
	get(roomId: string) {
		return (this.rooms.get(roomId));
	}

	/**
	 * Create a new room
	 */
	private createRoom(args: {
		roomId: string;
		seed: number;
		config: GameConfig;
		hostId: string;
		playerIds: string[];
	}) {
		const { roomId, seed, config, hostId, playerIds } = args;

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
		const sceneById: Record<string, PlayerPhase> = {};
		for (const id of playerIds) sceneById[id] = "lobby";
	
		// Add room
		const room: Room = {
			phase: "lobby",
			roomId,
			seed,
			config,
			state,
			hostId,
			playerIds: [...playerIds],
			sceneById,
			inputsById,
			subscribers: new Set(),
		};

		this.rooms.set(roomId, room);

		logInfo("room.created", {
			roomId,
			hostId,
			seed,
			playerCount: room.playerIds.length,
			tickRate: config.tickRate,
		});

		return (room);
	}

	/**
	 * Get current room, or create new room
	 */
	private ensureRoom(args: {
		roomId: string;
		seed: number;
		config: GameConfig;
		hostId: string;
	}) {
		const existingRoom = this.rooms.get(args.roomId);
		if (existingRoom)
				return (existingRoom);

		return this.createRoom({
			roomId: args.roomId,
			seed: args.seed,
			config: args.config,
			hostId: args.hostId,
			playerIds: [],
		});
	}

	/**
	 * Add a player to the room
	 */
	private addPlayerToRoom(roomId: string, playerId: string) {
		const room = this.get(roomId);
		
		if (!room)
			throw new Error(`Unknown roomId: ${roomId}`);

		if (room.phase === "finished") {
			throw new Error(`Room ${roomId} is finished`);
		}

		const wasAlreadyInRoom = room.playerIds.includes(playerId);

		if (!wasAlreadyInRoom) {
			room.playerIds.push(playerId);
			logInfo("room.player_added", {
				roomId,
				playerId,
				playerCount: room.playerIds.length,
			});
		} else {
			logInfo("room.player_rejoin", { roomId, playerId });
		}

		if (!(playerId in room.inputsById)) room.inputsById[playerId] = 0;
		if (!(playerId in room.sceneById)) room.sceneById[playerId] = "lobby";

		// Only reset if new player joined
		if (!wasAlreadyInRoom) {
			this.resetGame(room);
		}
		this.broadcastState(roomId);
	}

	/**
	 * Will create a room if nonexistent, otherwise join
	 */
	public createOrJoinRoom(args: {
		roomId: string;
		playerId: string;
		seed: number;
		config: GameConfig;
	}): Room {

		const existedBefore = this.rooms.has(args.roomId);

		const room = this.ensureRoom({
			roomId: args.roomId,
			seed: args.seed,
			config: args.config,
			hostId: args.playerId,
		});

		const beforeCount = room.playerIds.length;
		const alreadyMember = room.playerIds.includes(args.playerId);

		this.addPlayerToRoom(args.roomId, args.playerId);

		const afterCount = room.playerIds.length;

		logInfo("room.create_or_join", {
			roomId: args.roomId,
			playerId: args.playerId,
			created: !existedBefore,
			alreadyMember,
			phase: room.phase,
			playerCountBefore: beforeCount,
			playerCountAfter: afterCount,
			hostId: room.hostId,
		});

		return (room);
	}

	/**
	 * Close current room
	 */
	public closeRoom(roomId: string, reason = "closed") {
		const room = this.get(roomId);
		if (!room) return;

		if (room.timer) clearInterval(room.timer);

		for (const ws of room.subscribers) {
			safeSend(ws, { type: "room_closed", roomId, reason });
		}

		this.rooms.delete(roomId);

		logInfo("room.closed", {
			roomId,
			reason,
			subscribers: room.subscribers.size,
			playerCount: room.playerIds.length,
		});
	}


	/* ====================================================================== */
	/*                                SOCKET                                  */
	/* ====================================================================== */

	/**
	 * Add a new web socket to list of subscribers
	 * `set`, no duplicates
	 */
	subscribe(roomId: string, ws: WebSocket) {
		const room = this.rooms.get(roomId);
		if (!room)
			throw new Error(`Unknown roomId: ${roomId}`);

		const before = room.subscribers.size;
		room.subscribers.add(ws);

		logInfo("room.subscribed", {
			roomId,
			subsBefore: before,
			subsAfter: room.subscribers.size,
		});
	}

	/**
	 * Remove a web socket from list of subscribers
	 */
	unsubscribe(roomId: string, ws: WebSocket) {
		const room = this.rooms.get(roomId);
		if (!room)
			throw new Error(`Unknown roomId: ${roomId}`);
		
		const before = room.subscribers.size;
		room.subscribers.delete(ws);

		logInfo("room.unsubscribed", {
			roomId,
			subsBefore: before,
			subsAfter: room.subscribers.size,
		});
	}

	unsubscribeAll(ws: WebSocket) {
		let removedFrom = 0;

		for (const room of this.rooms.values()) {
			if (room.subscribers.delete(ws)) removedFrom++;
		}

		if (removedFrom > 0) {
			logInfo("ws.unsubscribed_all", { removedFrom });
		}
	}


	/* ====================================================================== */
	/*                           SCENE / PHASE CONTROL                        */
	/* ====================================================================== */

	/**
	 * Update the scene for a player
	 */
	updatePlayerScene(roomId: string, playerId: string, scene: PlayerPhase ) {
		const room = this.rooms.get(roomId);
		if (!room)
			throw new Error(`Unknown roomId: ${roomId}`);

		if (!room.playerIds.includes(playerId))
			throw new Error(`Unknown playerId ${playerId} for room ${roomId}`);

		if (room.sceneById[playerId] === scene)
			return;

		const prev = room.sceneById[playerId];
		room.sceneById[playerId] = scene;

		logInfo("room.scene_updated", {
			roomId,
			playerId,
			from: prev,
			to: scene,
		});
	}

	/**
	 * Set room to ready when all players have entered game
	 * lobby -> ready
	 */
	willUpdateRoomPhase(roomId: string) {
		const room = this.get(roomId);
		if (!room)
			throw new Error(`Unknown roomId: ${roomId}`);

		if (room.phase !== "lobby")
			return;

		const allOnGameCanvas = room.playerIds.every((id) => room.sceneById[id] === "game");
		if (!allOnGameCanvas) {
			logInfo("room.phase_check_not_ready", {
				roomId,
				phase: room.phase,
				playerIds: room.playerIds,
				sceneById: room.sceneById,
			});
			return;
		}

		room.phase = "ready";

		logInfo("room.phase_changed", { roomId, from: "lobby", to: "ready" });

		this.broadcast(roomId, {
			type: "state",
			snapshot: this.makeSnapshot(room),
		} satisfies ServerMsg);
	}

	/**
	 * Set room to `running`
	 */
	setRoomToRunning(roomId: string) {
		const room = this.get(roomId);
		if (!room) throw new Error(`Unknown roomId: ${roomId}`);

		if (room.phase !== "ready") {
			logInfo("room.phase_change_rejected", {
				roomId,
				want: "running",
				have: room.phase,
			});
			return;
		}

		room.phase = "running";

		logInfo("room.phase_changed", { roomId, from: "ready", to: "running" });

		this.broadcast(roomId, {
			type: "state",
			snapshot: this.makeSnapshot(room),
		} satisfies ServerMsg);
	}


	/* ====================================================================== */
	/*                                  INPUT                                 */
	/* ====================================================================== */

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


	/* ====================================================================== */
	/*                                BROADCAST                               */
	/* ====================================================================== */

	/**
	 * Send a message to all players
	 */
	broadcast(roomId: string, msg: ServerMsg) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		for (const ws of room.subscribers) {
			safeSend(ws, msg);
		}
	}

	/**
	 * Send current room state to all players
	 */
	broadcastState(roomId: string) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		this.broadcast(roomId, {
			type: "state",
			snapshot: this.makeSnapshot(room),
		} satisfies ServerMsg);
	}

	/**
	 * Make snapshot with correct types
	 */
	private makeSnapshot(room: Room) {
		return {
			phase: room.phase,
			tick: room.state.tick,
			seed: room.state.seed,
			rngState: room.state.rngState,
			hostId: room.hostId,
			playerIds: [...room.playerIds],
			sceneById: {...room.sceneById},

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


	/* ====================================================================== */
	/*                               GAME CONTROL                             */
	/* ====================================================================== */

	/**
	 * Start the game loop, will broadcast state
	 */
	startRoom(roomId: string) {
		this.startLoop(roomId);
	}

	/**
	 * Start game loop
	 */
	private startLoop(roomId: string) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		if (room.timer)
			return;

		const tickRate = room.config.tickRate;
		const dtMs = Math.round(1000 / tickRate);

		room.timer = setInterval(() => {
			if (room.phase !== "running") return;

			const inputsSnapshot = { ...room.inputsById };

			const res = step(room.state, inputsSnapshot, room.config);
			room.state = res.state;
			this.broadcastState(roomId);

			if (res.justFinished) {
				this.finishRoom(roomId, res.winnerId);
			}

		}, dtMs);
	}

	/**
	 * When a game winner has been set, game ends
	 */
	private finishRoom(roomId: string, winnerId: string | null) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		// Guard: prevent double-finish
		if (room.phase === "finished") return;

		room.phase = "finished";

		if (room.timer) {
			clearInterval(room.timer);
			room.timer = null;
		}

		logInfo("room.finished", {
			roomId,
			winnerId,
		});

		const msg = {
			type: "game_finished",
			roomId,
			winnerId,
		} satisfies ServerMsg;

		this.broadcast(roomId, msg);
	}

	/**
	 * Used to create a new GameConfig, seeds and colors when player joins
	 */
	private resetGame(room: Room) {
		room.state = initGame(room.config, room.seed, room.playerIds);

		const inputsById: Record<string, TurnInput> = {};
		for (const id of room.playerIds) inputsById[id] = 0;
		room.inputsById = inputsById;

		for (const id of room.playerIds) {
			if (!(id in room.sceneById)) room.sceneById[id] = "lobby";
		}
	}
	
};
