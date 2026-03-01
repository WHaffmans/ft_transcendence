/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   room_manager.ts                                    :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/01/06 14:35:21 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/02/26 10:14:24 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

import type WebSocket from "ws";

// Game
import { initGame } from "../engine/init.js";
import type { GameState, PlayerState } from "../engine/init.js";
import type { GameConfig } from "../engine/config.js";
import { step } from "../engine/step.js";
import type { TurnInput } from "../engine/step.js";

// Utils
import { finishGame, leaveGame, startGame } from "../stores/backend_api.js";
import { updateRatingsOpenSkill } from "../open_skill/openskill_adapter.js";
import { replaceTimeout, replaceInterval, replaceMapTimeout } from "./timers.js";
import type { TimeoutHandle, IntervalHandle } from "./timers.js";

// External
import { ServerMsgSchema, type ServerMsg, WS_CLOSE_ROOM_CLOSED } from "@ft/game-ws-protocol";
import type { GamePhase, PlayerPhase, Player } from "@ft/game-ws-protocol";


const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;
const LOBBY_LIFETIME_MS = 60_000;
const LIFETIME_BROADCAST_INTERVAL = 1000;
const AFK_TIMEOUT_MS = 5 * 60 * 1000;					// 5 minutes total

type Room = {
	phase: GamePhase;
	roomId: string;
	seed: number;
	config: GameConfig;
	state: GameState;

	// Players
	hostId: string;
	players: Player[];
	allPlayers: Player[];					// snapshot of all participants at game start (never mutated by dropPlayer)
	sceneById: Record<string, PlayerPhase>;
	inputsById: Record<string, TurnInput>;
	finishOrder: string[];								// [firstOut, ..., winner]

	// Handle ticks
	timer?: NodeJS.Timeout | null;

	// Lobby lifetime
	autoStartTimerTimeout: TimeoutHandle;				// setTimeout (kick)
	autoStartTimerInterval: IntervalHandle;				// setInterval (broadcast)
	autoStartDeadlineAtMs: number | null;				// log info
	afkTimeoutById: Record<string, TimeoutHandle>;		// setTimeout (inactivity)

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

	private getPlayerIds(room: Room): string[] {
		return (room.players.map((p) => p.playerId));
	}

	private getPlayer(room: Room, playerId: string): Player | undefined {
		return (room.players.find((p) => p.playerId === playerId));
	}

	private getPlayerState(state: GameState, playerId: string): PlayerState | null {
		return (state.players.find(p => p.id === playerId) ?? null);
	}

	// TODO: Use This
	private getRoomOrThrow(roomId: string): Room {
		const room = this.rooms.get(roomId);
		if (!room)
			throw new Error(`Unknown roomId: ${roomId}`);
		return (room);
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
			allPlayers: [],
			sceneById,
			inputsById,
			finishOrder: [],
			autoStartTimerTimeout: null,
			autoStartTimerInterval: null,
			autoStartDeadlineAtMs: null,
			afkTimeoutById: {},
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
		const room = this.getRoomOrThrow(roomId);
		if (room.phase === "finished") throw new Error(`Room ${roomId} is finished`);
		if (room.phase === "running" || room.phase === "ready") {
			const alreadyIn = room.players.some(p => p.playerId === player.playerId);
			if (!alreadyIn) throw new Error(`Room ${roomId} is already in progress`);
		}

		const existing = this.getPlayer(room, player.playerId);
		const wasAlreadyInRoom = !!existing;

		const joinCheck = this.canJoin(room, player.playerId);
		if (!joinCheck.ok) {
				logInfo("room.join_rejected", {
				roomId,
				playerId: player.playerId,
				reason: joinCheck.reason,
				playerCount: room.players.length,
				max: MAX_PLAYERS,
			});
			throw new Error(`Cannot join room ${roomId}: ${joinCheck.reason}`);
		}

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

		this.executeAutoStartTimer(roomId);
		this.broadcastState(roomId);

		// Start AFK timer for newly joined not-ready players
		if (room.phase === "lobby" && room.sceneById[player.playerId] === "lobby") {
			this.startAfkTimer(roomId, player.playerId);
		}
	}

	/**
	 * Will create a room if nonexistent, otherwise join.
	 * If 'ws' is provided, subscribes it before adding the player
	 * so the joining client receives broadcasts fired during join.
	 */
	public createOrJoinRoom(args: {
		roomId: string;
		player: Player;
		seed: number;
		config: GameConfig;
	}, ws?: WebSocket): Room {

		const existedBefore = this.rooms.has(args.roomId);

		const room = this.ensureRoom({
			roomId: args.roomId,
			seed: args.seed,
			config: args.config,
			hostId: args.player.playerId,
		});

		if (ws) this.subscribe(args.roomId, ws);

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


	/* ====================================================================== */
	/*                            AUTO-START TIMER                            */
	/* ====================================================================== */

	private autoStartTimerTimeout(roomId: string) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		this.stopAutoStartTimer(room);

		if (room.phase === "lobby") {
			this.onAutoStartTimerExpired(roomId);
		}
	}


	/**
	 * Start, stop or continue lobby timer
	 * 		- 2+ ready players, auto-start game.
	 * 		- Else, close room.
	 */
	private executeAutoStartTimer(roomId: string) {
		const room = this.rooms.get(roomId);
		if (!room || room.phase !== "lobby") return;

		const playerIds = this.getPlayerIds(room);
		const readyPlayers = playerIds.filter(
			(id) => room.sceneById[id] === "game"
		);
		const allReady = readyPlayers.length === playerIds.length;

		const shouldRun = room.players.length >= 2 && readyPlayers.length >= 2 && !allReady;
		const isRunning = !!room.autoStartTimerTimeout || !!room.autoStartTimerInterval;

		if (shouldRun && !isRunning) {
			this.autoStartTimer(room, LOBBY_LIFETIME_MS);
		} else if (!shouldRun && isRunning) {
			this.stopAutoStartTimer(room);
			this.broadcast(roomId, {
				type: "lobby_timer",
				roomId,
				secondsLeft: 0,
				deadlineAtMs: 0,
			});
		}
	}

	/**
	 * Timer to auto-start game.
	 * 		- On tick: broadcasts remaining seconds.
	 *		- On expiry: kicks non-ready players, start with 2+ players.
	 */
	private autoStartTimer(room: Room, ms = LOBBY_LIFETIME_MS) {
		if (room.autoStartTimerTimeout || room.autoStartTimerInterval) return;

		const roomId = room.roomId;
		room.autoStartDeadlineAtMs = Date.now() + ms;

		const broadcastTick = () => {
			const live = this.rooms.get(roomId);
			if (!live) return;

			if (live.phase !== "lobby") {
				this.stopAutoStartTimer(live);
				return;
			}

			const deadlineAtMs = live.autoStartDeadlineAtMs ?? 0;
			const msLeft = deadlineAtMs - Date.now();
			const secondsLeft = Math.max(0, Math.ceil(msLeft / 1000));

			this.broadcast(roomId, {
				type: "lobby_timer",
				roomId,
				secondsLeft,
				deadlineAtMs,
			});

			if (secondsLeft <= 0) {
				this.stopAutoStartTimer(live);
				return;
			}
		};

		broadcastTick();

		replaceInterval(room, "autoStartTimerInterval", LIFETIME_BROADCAST_INTERVAL, broadcastTick);
		replaceTimeout(room, "autoStartTimerTimeout", ms, () => {
			this.autoStartTimerTimeout(roomId);
		});

		logInfo("room.lobby_timer_started", {
			roomId,
			ms,
			deadlineAt: room.autoStartDeadlineAtMs,
		});
	}

	/**
	 * Auto-start action.
	 */
	private onAutoStartTimerExpired(roomId: string) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		this.stopAllAfkTimers(room);

		const toKick = this.getPlayerIds(room).filter(
			(id) => room.sceneById[id] !== "game"
		);

		logInfo("room.lobby_timer_expired", {
			roomId,
			toKick,
			sceneById: room.sceneById,
			playerCount: room.players.length,
		});

		(async () => {
			// Broadcast `left` and drop each non-ready player
			for (const playerId of toKick) {
				const still = this.rooms.get(roomId);
				if (!still) return;

				if (still.sceneById[playerId] !== "game") {
					this.broadcast(roomId, {
						type: "left",
						roomId,
						playerId,
					});
					await this.dropPlayer(roomId, playerId);
				}
			}

			const after = this.rooms.get(roomId);
			if (!after) return;

			// Not enough players to start. Will close the room
			if (after.players.length < 2) {
				logInfo("room.lobby_timer_not_enough_players", {
					roomId,
					playerCount: after.players.length,
				});
				this.closeRoom(roomId, "Not enough players after timer expired");
				return;
			}

			// Auto-start. All ready players enter game
			for (const id of this.getPlayerIds(after)) {
				after.sceneById[id] = "game";
			}

			// Set room to ready
			this.resetGame(after);
			after.phase = "ready";
			logInfo("room.phase_changed", { roomId, from: "lobby", to: "ready" });

			this.broadcastState(roomId);

		})().catch((err) => {
			logError("room.lobby_timer_expired_failed", { roomId, err });
		});
	}

	private stopAutoStartTimer(room: Room) {
		if (room.autoStartTimerInterval) {
			clearInterval(room.autoStartTimerInterval);
			room.autoStartTimerInterval = null;
		}
		if (room.autoStartTimerTimeout) {
			clearTimeout(room.autoStartTimerTimeout);
			room.autoStartTimerTimeout = null;
		}
		room.autoStartDeadlineAtMs = null;

		logInfo("room.lobby_join_timer_stopped", { roomId: room.roomId });
	}


	/* ====================================================================== */
	/*                             AFK TIMER                                  */
	/* ====================================================================== */

	/**
	 * Away From Keyboard. Close lobby after 5 minutes.
	 */
	private startAfkTimer(roomId: string, playerId: string) {
		const room = this.rooms.get(roomId);
		if (!room || room.phase !== "lobby") return;

		if (room.sceneById[playerId] === "game") return;

		this.stopAfkTimer(room, playerId);

		logInfo("afk.timer_started", { roomId, playerId, timeoutMs: AFK_TIMEOUT_MS });

		const deadlineAtMs = Date.now() + AFK_TIMEOUT_MS;

		replaceMapTimeout(room.afkTimeoutById, playerId, AFK_TIMEOUT_MS, () => {
			this.onAfkExpired(roomId, playerId);
		});

		this.broadcast(roomId, {
			type: "afk_timer",
			roomId,
			playerId,
			secondsLeft: Math.ceil(AFK_TIMEOUT_MS / 1000),
			deadlineAtMs,
		});
	}

	/**
	 * Fire AFK
	 */
	private onAfkExpired(roomId: string, playerId: string) {
		const room = this.rooms.get(roomId);
		if (!room || room.phase !== "lobby") return;
		if (!this.getPlayer(room, playerId)) return;

		logInfo("afk.timer_expired", { roomId, playerId });

		this.stopAfkTimer(room, playerId);

		this.broadcast(roomId, { type: "left", roomId, playerId });
		void this.willLeaveLobby(roomId, playerId);
	}

	/**
	 * Clear a player's AFK timer.
	 */
	private stopAfkTimer(room: Room, playerId: string) {
		const h = room.afkTimeoutById[playerId];
		if (h) {
			logInfo("afk.timer_stopped", { roomId: room.roomId, playerId });
			clearTimeout(h);
		}
		delete room.afkTimeoutById[playerId];
	}

	/**
	 * Clear all AFK timers for a room.
	 */
	private stopAllAfkTimers(room: Room) {
		for (const pid of Object.keys(room.afkTimeoutById)) {
			this.stopAfkTimer(room, pid);
		}
	}


	/* ====================================================================== */
	/*                             CLOSE ROOM                                 */
	/* ====================================================================== */

	/**
	 * Close current room
	 */
	public closeRoom(roomId: string, reason = "closed") {
		const room = this.getRoomOrThrow(roomId);

		this.stopRoomTimer(room);
		this.stopAutoStartTimer(room);
		this.stopAllAfkTimers(room);

		for (const ws of room.subscribers) {
			safeSend(ws, { type: "room_closed", roomId, reason });
			// Close the socket with a proper application close code so the
			// client can distinguish "room closed" from unexpected disconnects.
			if (ws.readyState === ws.OPEN || ws.readyState === ws.CONNECTING) {
				ws.close(WS_CLOSE_ROOM_CLOSED, reason.slice(0, 123));
			}
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
	 * Remove a single player from the room.
	 * 		- Sets new `host`.
	 * 		- Close room if empty.
	 */
	private async dropPlayer(roomId: string, playerId: string) {
		const room = this.getRoomOrThrow(roomId);
		const idx = room.players.findIndex(p => (p as any).playerId === playerId);
		if (idx === -1) return;

		this.stopAfkTimer(room, playerId);

		delete room.sceneById[playerId];
		delete room.inputsById[playerId];

		room.players.splice(idx, 1);
		
		// Set new Host
		if (room.hostId === playerId) {
			if (room.players.length > 0) {
				// Promote first remaining player
				const newHostId = String((room.players[0] as any).playerId);
				logInfo("room.host_reassigned", { roomId, from: playerId, to: newHostId });
				room.hostId = newHostId;
			} else {
				room.hostId = "";
			}
		}

		await this.persistLeaveRoom(roomId, playerId);

		// Close if empty
		if (room.players.length === 0) {
			this.closeRoom(roomId, "Room was empty, all players were removed.");
		}
	}

	/**
	 * Remove a player from the room when in Lobby
	 */
	private async willLeaveLobby(roomId: string, playerId: string) {
		const room = this.getRoomOrThrow(roomId);
		
		await this.dropPlayer(roomId, playerId);

		logInfo("room.leave_lobby", {
			roomId,
			playerId,
			playerCountAfter: room.players.length,
			newHost: room.hostId,
		});

		if (! this.rooms.has(roomId)) return;

		// Rebuild game state so it only contains the remaining players
		this.resetGame(room);
		this.executeAutoStartTimer(roomId);
		this.willUpdateRoomPhase(roomId);
		this.broadcastState(roomId);
	}

	private async willLeaveGame(roomId: string, playerId: string) {
		const room = this.getRoomOrThrow(roomId);
		if (room.sceneById[playerId] !== "game") return;
		
		if (!room.finishOrder.includes(playerId)) room.finishOrder.push(playerId);
		this.setPlayerAlive(roomId, playerId, false);
		await this.dropPlayer(roomId, playerId);

		logInfo("room.leave_game", {
			roomId,
			playerId,
			playerCountAfter: room.players.length,
			newHost: room.hostId,
		});

		if (! this.rooms.has(roomId)) return;

		// Close if empty
		if (room.players.length === 0) {
			this.closeRoom(roomId, "Room was empty, all players were removed.");
			return;
		}

		// Close room, too few players to start
		if (room.phase === "ready" && room.players.length < MIN_PLAYERS) {
			this.closeRoom(roomId, "Not enough players during countdown");
			return;
		}

		this.broadcastState(roomId);

		if (room.phase === "running" && room.players.length === 1) {
			const [onlyPlayer] = room.players;
			if (!onlyPlayer)
				return;
			const winnerId = onlyPlayer.playerId;
			await this.finishRoom(roomId, winnerId);
		}
	}

	/**
	 * Leave `lobby` or `game`
	 */
	public onPlayerDisconnected(roomId: string, playerId: string, ws: WebSocket, meta: any) {
		const room = this.rooms.get(roomId);

		this.unsubscribe(roomId, ws);

		if (!room) {
			logInfo("room.player_disconnected_after_close", { roomId, playerId, reason: meta });
			return;
		}

		logInfo("room.player_disconnected", {
			roomId,
			playerId,
			playerSceme: room.sceneById[playerId],
			reason: meta
		});

		if (room.phase === "lobby") {
			void this.willLeaveLobby(roomId, playerId);
		} else {
			void this.willLeaveGame(roomId, playerId);
		}
	}


	/**
	 * Notify API of player leave.
	 */
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

	/**
	 * Toggle player `alive` / `dead`
	 */
	private setPlayerAlive(roomId: string, playerId: string, newAlive: boolean) {
		const room = this.getRoomOrThrow(roomId);
		const p = this.getPlayerState(room.state, playerId);
  		if (!p) return;

		if (p.alive === newAlive)
			return;
  		p.alive = newAlive;
	}


	/* ====================================================================== */
	/*                              LIMITES                                   */
	/* ====================================================================== */

	private canJoin(room: Room, playerId: string) {
		const alreadyMember = room.players.some(p => p.playerId === playerId);
		if (alreadyMember)
			return { ok: true as const };

		if (room.players.length >= MAX_PLAYERS)
			return { ok: false as const, reason: "room_full" as const };
		return { ok: true as const };
	}

	private canStart(room: Room) {
		const n = room.players.length;
		if (n < MIN_PLAYERS)
			return { ok: false as const, reason: "not_enough_players" as const };

		if (n > MAX_PLAYERS)
			return { ok: false as const, reason: "too_many_players" as const };
		return { ok: true as const };
	}

	


	/* ====================================================================== */
	/*                                SOCKET                                  */
	/* ====================================================================== */

	/**
	 * Add a new web socket to list of subscribers
	 * `set`, no duplicates
	 */
	subscribe(roomId: string, ws: WebSocket) {
		const room = this.getRoomOrThrow(roomId);

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
		if (!room) return;
		
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
		const room = this.getRoomOrThrow(roomId);

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

		// AFK timer: ready -> stop, unready -> start
		if (scene === "game") {
			this.stopAfkTimer(room, playerId);
			this.broadcast(roomId, {
				type: "afk_timer", roomId, playerId,
				secondsLeft: 0, deadlineAtMs: 0,
			});
		} else if (scene === "lobby" && room.phase === "lobby") {
			this.startAfkTimer(roomId, playerId);
		}

		this.executeAutoStartTimer(roomId);
		this.willUpdateRoomPhase(roomId);
  		this.broadcastState(roomId);
	}

	/**
	 * Set room to ready when all players have entered game
	 * lobby -> ready
	 */
	willUpdateRoomPhase(roomId: string) {
		const room = this.getRoomOrThrow(roomId);

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

		if (room.players.length < MIN_PLAYERS) return;
		if (room.players.length > MAX_PLAYERS) return;

		room.phase = "ready";
		this.stopAutoStartTimer(room);
		this.stopAllAfkTimers(room);

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
		const room = this.getRoomOrThrow(roomId);

		if (room.phase !== "ready") {
			logInfo("room.phase_change_rejected", {
				roomId,
				want: "running",
				have: room.phase,
			});
			return;
		}

		const startCheck = this.canStart(room);
		if (!startCheck.ok) {
				logInfo("room.start_rejected", {
				roomId,
				reason: startCheck.reason,
				playerCount: room.players.length,
				min: MIN_PLAYERS,
				max: MAX_PLAYERS,
			});
			return;
		}

		room.phase = "running";
		room.allPlayers = room.players.map(p => ({ ...p }));

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
		const room = this.getRoomOrThrow(roomId);

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
		const room = this.getRoomOrThrow(roomId);

		for (const ws of room.subscribers) {
			safeSend(ws, msg);
		}
	}

	/**
	 * Send current room state to all players
	 */
	broadcastState(roomId: string) {
		const room = this.getRoomOrThrow(roomId);

		this.broadcast(roomId, {
			type: "state",
			snapshot: this.makeSnapshot(room),
		} satisfies ServerMsg);
	}

	/**
	 * Make snapshot with correct types
	 */
	private makeSnapshot(room: Room) {

		const segs = room.state.segments;
		const start = Math.max(0, segs.length - room.config.segmentSendCount);

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

			segments: segs.slice(start).map((s) => ({
				i: s.i,
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
		const room = this.getRoomOrThrow(roomId);

		if (room.timer)
			return;

		const tickRate = room.config.tickRate;
		const dtMs = Math.round(1000 / tickRate);

		logInfo("room.game_loop_started", { roomId, tickRate, dtMs });

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

	// TODO: Use this helper
	/**
	 * Stops the room tick timer
	 */
	private stopRoomTimer(room: Room) {
		if (!room.timer) return;
		logInfo("room.game_loop_stopped", { roomId: room.roomId });
		clearInterval(room.timer);
		room.timer = null;
	}

	private applyFinishOrder(room: Room, winnerId: string | null) {
		if (winnerId && !room.finishOrder.includes(winnerId)) room.finishOrder.push(winnerId);

		for (const p of room.players) {
			if (!room.finishOrder.includes(p.playerId)) room.finishOrder.push(p.playerId);
		}
	}

	private computeAndApplyNewRatings(room: Room) {
		// Use allPlayers (snapshot from game start) so departed players are included
		const allP = room.allPlayers.length > 0 ? room.allPlayers : room.players;

		const playerRatings = allP.map((p) => ({
			id: p.playerId,
			mu: p.rating_mu,
			sigma: p.rating_sigma,
		}));

		logInfo("ratings.pre", {
			players: allP.map((p) => ({
				id: p.playerId,
				mu: p.rating_mu,
				sigma: p.rating_sigma,
			})),
		});

		// Compute new ratings with OpenSkill
		const updated = updateRatingsOpenSkill(playerRatings, { finishOrder: room.finishOrder });
		
		// Merge updated mu/sigma back into allPlayers
		const updatedById = new Map(updated.map((u) => [u.id, u] as const));

		room.allPlayers = allP.map((p) => {
			const u = updatedById.get(p.playerId);
			if (!u) return p;

			return {
				...p,
				rating_mu: u.mu,
				rating_sigma: u.sigma,
			};
		});

		logInfo("ratings.post", {
			players: room.allPlayers.map((p) => ({
				id: p.playerId,
				mu: p.rating_mu,
				sigma: p.rating_sigma,
			})),
		});
	}

	/**
	 * When a game winner has been set, game ends
	 */
	private async finishRoom(roomId: string, winnerId: string | null) {
		const room = this.getRoomOrThrow(roomId);
		if (room.phase === "finished") return;

		room.phase = "finished";
		this.stopRoomTimer(room);
		this.applyFinishOrder(room, winnerId);

		logInfo("room.finished", {
			roomId,
			roomPhase: room.phase,
			winnerId,
			finishOrder: room.finishOrder,
		});

		const msg = {
			type: "game_finished",
			roomId,
			winnerId,
		} satisfies ServerMsg;
		this.broadcastState(roomId);
		this.broadcast(roomId, msg);

		// Persist game with new ratings
		try {
			this.computeAndApplyNewRatings(room);

			// Build backend payload from allPlayers (includes departed players)
			const allP = room.allPlayers.length > 0 ? room.allPlayers : room.players;
			const payload = this.toFinishPayload(
				allP.map((p) => ({
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


	/**
	* Create payload for BE `finish`
	* Finish order is reversed.
	*/
	private toFinishPayload(
		roomPlayers: { playerId: string; rating_mu: number; rating_sigma: number }[],
		finishOrder: string[],
	) {
		const rankById = new Map<string, number>();
		const n = finishOrder.length;

		// finishOrder is death-order: [firstDead, ..., winner]
		// ranking wants: winner=1, ..., firstDead=n
		for (const [i, id] of finishOrder.entries()) {
			rankById.set(id, n - i);
		}

		// Fallback
		for (const p of roomPlayers) {
			if (!rankById.has(p.playerId)) rankById.set(p.playerId, n);
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
