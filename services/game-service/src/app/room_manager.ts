/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   room_manager.ts                                    :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/01/06 14:35:21 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/02/11 12:38:56 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import type WebSocket from "ws";

// Game
import { initGame } from "../engine/init.js";
import type { GameState } from "../engine/init.js";
import type { GameConfig } from "../engine/config.js";
import { step } from "../engine/step.js";
import type { TurnInput } from "../engine/step.js";

// Utils
import { finishGame, leaveGame, startGame } from "../stores/backend_api.js";
import { updateRatingsOpenSkill } from "../open_skill/openskill_adapter.js";

// External
import { ServerMsgSchema, type ServerMsg } from "@ft/game-ws-protocol";
import type { GamePhase, PlayerPhase, Player } from "@ft/game-ws-protocol";


type Room = {
	phase: GamePhase;
	roomId: string;
	seed: number;
	config: GameConfig;
	state: GameState;

	// Players
	hostId: string;
	players: Player[];
	sceneById: Record<string, PlayerPhase>;
	inputsById: Record<string, TurnInput>;
	finishOrder: string[];					// [firstOut, ..., winner]

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
	/*                              GETTERS / SETTERS                         */
	/* ====================================================================== */

	/**
	 * Search for a room
	 */
	get(roomId: string) {
		return (this.rooms.get(roomId));
	}

	getPlayerIds(room: Room): string[] {
		return (room.players.map((p) => p.playerId));
	}

	getPlayer(room: Room, playerId: string): Player | undefined {
		return (room.players.find((p) => p.playerId === playerId));
	}


	/* ====================================================================== */
	/*                              ROOM LIFECYCLE                            */
	/* ====================================================================== */

	/**
	 * Create a new room
	 */
	private createRoom(args: {
		roomId: string;
		seed: number;
		config: GameConfig;
		hostId: string;
		players: Player[];
	}) {
		const { roomId, seed, config, hostId, players } = args;
		const playerIds = players.map((p) => p.playerId);

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
			players: [...players],
			sceneById,
			inputsById,
			finishOrder: [],
			subscribers: new Set(),
		};

		this.rooms.set(roomId, room);

		logInfo("room.created", {
			roomId,
			hostId,
			seed,
			playerCount: room.players.length,
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
			players: [],
		});
	}

	/**
	 * Add a player to the room
	 */
	private addPlayerToRoom(roomId: string, player: Player) {
		const room = this.get(roomId);
		if (!room) throw new Error(`Unknown roomId: ${roomId}`);
		if (room.phase === "finished") throw new Error(`Room ${roomId} is finished`);

		const existing = this.getPlayer(room, player.playerId);
		const wasAlreadyInRoom = !!existing;

		if (!wasAlreadyInRoom) {
			room.players.push(player);
			logInfo("room.player_added", {
				roomId,
				playerId: player.playerId,
				rating_mu: player.rating_mu,
				rating_sigma: player.rating_sigma,
				playerCount: room.players.length,
			});
		} else {
			const idx = room.players.findIndex((p) => p.playerId === player.playerId);
			room.players[idx] = player;
			logInfo("room.player_rejoin", { roomId, playerId: player.playerId });
		}

		if (!(player.playerId in room.inputsById)) room.inputsById[player.playerId] = 0;
		if (!(player.playerId in room.sceneById)) room.sceneById[player.playerId] = "lobby";

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
		player: Player;
		seed: number;
		config: GameConfig;
	}): Room {

		const existedBefore = this.rooms.has(args.roomId);

		const room = this.ensureRoom({
			roomId: args.roomId,
			seed: args.seed,
			config: args.config,
			hostId: args.player.playerId,
		});

		const beforeCount = room.players.length;
		const alreadyMember = !!this.getPlayer(room, args.player.playerId);

		this.addPlayerToRoom(args.roomId, args.player);

		 const afterCount = room.players.length;

		logInfo("room.create_or_join", {
			roomId: args.roomId,
			playerId: args.player.playerId,
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
			playerCount: room.players.length,
		});
	}

	/**
	 * Remove a player from the room when in Lobby
	 */
	public async willLeaveLobby(roomId: string, playerId: string) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		if (room.sceneById[playerId] !== "lobby") return;
		
		// Drop player
		const idx = room.players.findIndex(p => (p as any).playerId === playerId);
		if (idx === -1) return;

		delete room.sceneById[playerId];
		delete room.inputsById[playerId];

		room.players.splice(idx, 1);
		
		// Host
		if (room.hostId === playerId) {
			if (room.players.length > 0) {
				// Promote first remaining player
				const newHostId = String((room.players[0] as any).playerId);
				room.hostId = newHostId;
			} else {
				room.hostId = "";
			}
		}

		await this.persistLeaveRoom(roomId, playerId);

		logInfo("room.willLeaveLobby", {
			roomId,
			playerId,
			playerCountAfter: room.players.length,
			newHost: room.hostId,
		});

		this.broadcastState(roomId);

		// If room is empty
		if (room.players.length === 0) {
			this.closeRoom(roomId);
			return;
		}
	}

	private async persistLeaveRoom(roomId: string, playerId: string) {
		const userId = Number(playerId);
		const payload = {
			user_id: userId,
		};
		try {
			await leaveGame(roomId, payload);
			logInfo("backend.leave_ok", { roomId });
		} catch (err) {
			logError("backend.leave_failed", { roomId, err });
		}
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

		if (!this.getPlayer(room, playerId))
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

		const allOnGameCanvas = this.getPlayerIds(room).every((id) => room.sceneById[id] === "game");
		if (!allOnGameCanvas) {
			logInfo("room.phase_check_not_ready", {
				roomId,
				phase: room.phase,
				playerIds: this.getPlayerIds(room),
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
			playerIds: this.getPlayerIds(room),
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
	async startRoom(roomId: string) {
		try {
			await startGame(roomId);
			logInfo("backend.start_ok", { roomId });
		} catch (err) {
			logError("backend.start_failed", { roomId, err });
		}
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
			if (room.phase !== "running")
				return;

			const inputsSnapshot = { ...room.inputsById };
			
			const prevAliveById = new Map<string, boolean>();
			for (const p of room.state.players)
				prevAliveById.set(p.id, p.alive);

			const res = step(room.state, inputsSnapshot, room.config);
			room.state = res.state;

			for (const p of room.state.players) {
				const wasAlive = prevAliveById.get(p.id) ?? false;
				const isAlive = p.alive;

				if (wasAlive && !isAlive) {
					if (!room.finishOrder.includes(p.id))
						room.finishOrder.push(p.id);
				}
			}

			this.broadcastState(roomId);

			if (res.justFinished) {
				const winnerId = res.winnerId;

				if (winnerId && !room.finishOrder.includes(winnerId)) {
					room.finishOrder.push(winnerId);
				}

				this.finishRoom(roomId, winnerId);
			}

		}, dtMs);
	}

	/**
	 * When a game winner has been set, game ends
	 */
	private async finishRoom(roomId: string, winnerId: string | null) {
		const room = this.rooms.get(roomId);
		if (!room) return;
		if (room.phase === "finished") return;

		room.phase = "finished";

		if (room.timer) {
			clearInterval(room.timer);
			room.timer = null;
		}

		if (winnerId) {
			if (!room.finishOrder.includes(winnerId)) room.finishOrder.push(winnerId);
		} else {
			if (room.finishOrder.length === 0) {
				room.finishOrder = room.players.map((p) => p.playerId);
			} else {
				for (const p of room.players) {
					if (!room.finishOrder.includes(p.playerId))
						room.finishOrder.push(p.playerId);
				}
			}
		}

		logInfo("room.finished", {
			roomId,
			winnerId,
			finishOrder: room.finishOrder,
		});

		const msg = {
			type: "game_finished",
			roomId,
			winnerId,
		} satisfies ServerMsg;

		this.broadcast(roomId, msg);

		// Persist game with new ratings
		try {
			// 1) Convert room players -> PlayerRating[]
			const playerRatings = room.players.map((p) => ({
				id: p.playerId,
				mu: p.rating_mu,
				sigma: p.rating_sigma,
			}));

			// 2) Compute new ratings with OpenSkill
			const updated = updateRatingsOpenSkill(playerRatings, {
				finishOrder: room.finishOrder,
			});

			// 3) Merge updated mu/sigma back into room.players
			const updatedById = new Map(updated.map((u) => [u.id, u] as const));

			room.players = room.players.map((p) => {
				const u = updatedById.get(p.playerId);
				if (!u)
					return (p);
				return {
					...p,
					rating_mu: u.mu,
					rating_sigma: u.sigma,
				};
			});

			// 4) Build backend payload
			const payload = this.toFinishPayload(
				room.players.map((p) => ({
					playerId: p.playerId,
					rating_mu: p.rating_mu,
					rating_sigma: p.rating_sigma,
				})),
				room.finishOrder,
			);

			await finishGame(roomId, payload);
			logInfo("backend.finish_ok", { roomId });
		} catch (err) {
			logError("backend.finish_failed", { roomId, err });
		}
	}

	/**
	 * Used to create a new GameConfig, seeds and colors when player joins
	 */
	private resetGame(room: Room) {
		const ids = this.getPlayerIds(room);
		room.state = initGame(room.config, room.seed, ids);

		const inputsById: Record<string, TurnInput> = {};
		for (const id of ids) inputsById[id] = 0;
		room.inputsById = inputsById;

		for (const id of ids) {
			if (!(id in room.sceneById)) room.sceneById[id] = "lobby";
		}

		room.finishOrder = [];
	}


	private toFinishPayload(
		roomPlayers: { playerId: string; rating_mu: number; rating_sigma: number }[],
		finishOrder: string[],
	) {
		const n = finishOrder.length;
		const rankById = new Map<string, number>();

		for (const [i, id] of finishOrder.entries()) {
			rankById.set(id, n - 1);
		}

		// Fallback
		for (const p of roomPlayers) {
			if (!rankById.has(p.playerId)) rankById.set(p.playerId, 2);
		}

		return {
			users: roomPlayers.map((p) => ({
				user_id: Number(p.playerId),
				rank: rankById.get(p.playerId)!,
				rating_mu: p.rating_mu,
				rating_sigma: p.rating_sigma,
			})),
		};
	}


};
