
import { z } from "zod";
import { browser } from "$app/environment";
import { writable, get } from "svelte/store";
import {
	ClientMsgSchema,
	ServerMsgSchema,
	type ClientMsg,
	type ServerMsg,
	PlayerSchema,
	WS_CLOSE_NORMAL,
	WS_CLOSE_LABELS,
} from "@ft/game-ws-protocol";


/* ========================================================================== */
/*                                  TYPES                                     */
/* ========================================================================== */

const MAX_WS_MESSAGES = 50;
type Player = z.infer<typeof PlayerSchema>;
type PlayerMeta = { name: string; avatar_url?: string };
type StateMsg = Extract<ServerMsg, { type: "state" }>;

type WSStoreState = {
	status: "disconnected" | "connecting" | "open" | "error";
	messages: ServerMsg[];
	lobbyTimer: {
		secondsLeft: number;
		deadlineAtMs: number;
		lastServerTsMs: number;
	} | null;
	latestState: StateMsg["snapshot"] | null;
	segments: Array<{
		i: number;
		x1: number; y1: number;
		x2: number; y2: number;
		ownerId: string;
		color: any;
		isGap: boolean;
	}>;
	lastSegI: number | null;
	roomId: string | null;
	playerId: string | null;
	playerMetaById: Record<string, PlayerMeta>;
	winnerId: string | null;
	lastRoomClosed: { roomId: string; reason: string } | null;
	afkTimer: { secondsLeft: number; deadlineAtMs: number } | null;
	resumeToken: string | null;
	pendingCreateOrJoin: { roomId: string; seed: number; player: Player } | null;
	pendingScene: { roomId: string; playerId: string; scene: "lobby" | "game" } | null;
};

function makeWsUrl() {
	if (!browser) return "";
	const proto = window.location.protocol === "https:" ? "wss" : "ws";
	return `${proto}://${window.location.host}/ws`;
}


/* ========================================================================== */
/*                                  RESUME KEY                                */
/* ========================================================================== */

function resumeKey(roomId: string) {
  return `ft:room:${roomId}:resume`;
}

function loadResumeToken(roomId: string) {
  if (!browser) return null;
  return localStorage.getItem(resumeKey(roomId));
}

function clearResumeToken(roomId: string) {
  if (!browser) return;
  localStorage.removeItem(resumeKey(roomId));
}


/* ========================================================================== */
/*                                  STORE                                     */
/* ========================================================================== */

/** State tied to a specific room session — cleared on join, leave, disconnect. */
const ROOM_SESSION_DEFAULTS: Pick<
	WSStoreState,
	| "latestState" | "segments" | "lastSegI" | "lobbyTimer"
	| "winnerId" | "lastRoomClosed" | "afkTimer" | "pendingScene"
> = {
	latestState: null,
	segments: [],
	lastSegI: null,
	lobbyTimer: null,
	winnerId: null,
	lastRoomClosed: null,
	afkTimer: null,
	pendingScene: null,
};

const INITIAL_STATE: WSStoreState = {
	status: "disconnected",
	messages: [],
	roomId: null,
	playerId: null,
	playerMetaById: {},
	resumeToken: null,
	pendingCreateOrJoin: null,
	...ROOM_SESSION_DEFAULTS,
};

function createWebSocketStore() {
	const store = writable<WSStoreState>({
		...INITIAL_STATE,
	});

	const { subscribe, set, update } = store;
	let ws: WebSocket | null = null;
	let lastLoggedPhase: string | null = null;
	let lastLoggedLobbyTimer: number | null = null;
	let lastLoggedAfkTimer: number | null = null;

	function logIncoming(msg: ServerMsg) {
		if (msg.type === "state") {
			const phase = msg.snapshot?.phase ?? null;
			if (phase !== lastLoggedPhase) {
				console.log("[ws] recv state phase:", lastLoggedPhase, "→", phase);
				lastLoggedPhase = phase;
			}
		} else if (msg.type === "game_started") {
			console.log("[ws] recv game_started", { roomId: msg.roomId });
		} else if (msg.type === "game_finished") {
			console.log("[ws] recv game_finished", { roomId: msg.roomId, winnerId: msg.winnerId ?? null });
		} else if (msg.type === "room_closed") {
			console.log("[ws] recv room_closed", { roomId: msg.roomId, reason: msg.reason });
		} else if (msg.type === "lobby_timer") {
			const isStart = lastLoggedLobbyTimer === null && msg.secondsLeft > 0;
			const isStop  = msg.secondsLeft <= 0 && msg.deadlineAtMs === 0;
			if (isStart || isStop) {
				console.log("[ws] recv lobby_timer", { secondsLeft: msg.secondsLeft });
			}
			lastLoggedLobbyTimer = isStop ? null : msg.secondsLeft;
		} else if (msg.type === "afk_timer") {
			const isStart = lastLoggedAfkTimer === null && msg.secondsLeft > 0;
			const isStop  = msg.secondsLeft <= 0 && msg.deadlineAtMs === 0;
			if (isStart || isStop) {
				console.log("[ws] recv afk_timer", { playerId: msg.playerId, secondsLeft: msg.secondsLeft });
			}
			lastLoggedAfkTimer = isStop ? null : msg.secondsLeft;
		} else if (msg.type === "joined") {
			console.log("[ws] recv joined", { roomId: msg.roomId, playerId: msg.playerId });
		} else if (msg.type === "left") {
			console.log("[ws] recv left", { roomId: msg.roomId, playerId: msg.playerId });
		} else if (msg.type === "error") {
			console.log("[ws] recv error", { message: msg.message });
		}
	}


	/* ========================================================================== */
	/*                                TRANSPORT                                   */
	/* ========================================================================== */

	function connect() {
		if (!browser) return;

		if (!navigator.onLine) {
			console.log("[ws] connect skipped (navigator.offline)");
			update((s) => ({ ...s, status: "disconnected" }));
			return;
		}

		if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

		update((s) => ({ ...s, status: "connecting" }));
		ws = new WebSocket(makeWsUrl());
		console.log("[ws] connecting to:", makeWsUrl());

		ws.onopen = () => {
			console.log("[ws] open");
			update((s) => ({ ...s, status: "open" }));

			const s = get(store);

			if (s.pendingCreateOrJoin) {
				const { roomId, seed, player } = s.pendingCreateOrJoin;

				console.log("[ws] replaying pendingCreateOrJoin", { roomId, playerId: player.playerId });
				
				const token = loadResumeToken(roomId);
				update((x) => ({ ...x, pendingCreateOrJoin: null }));
				sendClient({
					type: "create_or_join_room",
					roomId,
					seed,
					player,
					...(token ? { resumeToken: token } : {}),
				});
			}
		};

		ws.onmessage = (e) => {
			let raw: unknown;
			try {
				raw = JSON.parse(e.data);
			} catch {
				return;
			}

			const parsed = ServerMsgSchema.safeParse(raw);
			if (!parsed.success) {
				console.log("[ws] dropped non-ServerMsg:", raw, parsed.error.format());
				return;
			}

			const msg = parsed.data;
			logIncoming(msg);

			update((s) => {
				const isState = msg.type === "state";
				const snapshot = isState ? msg.snapshot : null;

				// Merge segments only when state snapshots
				let segments = s.segments;
				let lastSegI = s.lastSegI;

				if (snapshot?.segments) {
					const incoming = snapshot.segments.map((seg) => ({
						i: seg.i,
						x1: seg.x1,
						y1: seg.y1,
						x2: seg.x2,
						y2: seg.y2,
						ownerId: String(seg.ownerId),
						color: seg.color,
						isGap: !!seg.isGap,
					}));

					const mode = snapshot.segmentsMode ?? "delta";

					if (mode === "full") {
						segments = incoming;
						lastSegI = incoming.length ? incoming[incoming.length - 1].i : null;
					} else {
						const merged = mergeSegments(s.segments, s.lastSegI, incoming);
						segments = merged.segments;
						lastSegI = merged.lastSegI;
					}
				}

				// On join success
				let resumeToken = s.resumeToken;
				let pendingScene = s.pendingScene;

				if (msg.type === "joined") {
					if (pendingScene && ws && ws.readyState === WebSocket.OPEN) {
						const { roomId, playerId, scene } = pendingScene;

						const isCurrentSession =
							s.roomId === msg.roomId &&
							s.playerId === msg.playerId;

						if (isCurrentSession && roomId === msg.roomId && playerId === msg.playerId) {
							console.log("[ws] sending pendingScene after joined", { roomId, playerId, scene });
							sendClient({ type: "update_scene", roomId, playerId, scene });
							pendingScene = null;
						}
					}
				}

				// Lobby timer
				let lobbyTimer = s.lobbyTimer;

				if (msg.type === "lobby_timer") {
					if (msg.secondsLeft <= 0 && msg.deadlineAtMs === 0) {
						lobbyTimer = null;
					} else {
						lobbyTimer = {
							secondsLeft: msg.secondsLeft,
							deadlineAtMs: msg.deadlineAtMs,
							lastServerTsMs: Date.now(),
						};
					}
				} else if (msg.type === "game_started" || msg.type === "game_finished") {
					lobbyTimer = null;
				}

				// Room closed
				let lastRoomClosed = s.lastRoomClosed;
				if (msg.type === "room_closed") {
					clearResumeToken(msg.roomId);
					lastRoomClosed = { roomId: msg.roomId, reason: msg.reason };
				}

				// Game finished
				if (msg.type === "game_finished") {
					clearResumeToken(msg.roomId);
				}

				// AFK timer
				let afkTimer = s.afkTimer;
				if (msg.type === "afk_timer" && msg.playerId === s.playerId) {
					if (msg.secondsLeft <= 0 && msg.deadlineAtMs === 0) {
						afkTimer = null;
					} else {
						afkTimer = { secondsLeft: msg.secondsLeft, deadlineAtMs: msg.deadlineAtMs };
					}
				} else if (msg.type === "game_started" || msg.type === "game_finished") {
					afkTimer = null;
				}


				return {
					...s,
					messages: [...s.messages, msg].slice(-MAX_WS_MESSAGES),
					latestState: isState ? msg.snapshot : s.latestState,

					segments,
					lastSegI,
					lobbyTimer,
					lastRoomClosed,
					afkTimer,
					resumeToken,
					pendingScene,

					winnerId:
						msg.type === "game_finished"
						? (msg.winnerId ? String(msg.winnerId) : null)
						: msg.type === "game_started"
							? null
							: s.winnerId,
			    };
  			});
		};

		ws.onerror = (e) => {
			console.log("[ws] error", e);
			update((s) => ({ ...s, status: "error" }));
		};

		ws.onclose = (e) => {
			const label = WS_CLOSE_LABELS[e.code] ?? "unknown";
			console.log(`[ws] close: code=${e.code} (${label}), reason="${e.reason}"`);
			ws = null;
			update((s) => ({ ...s, status: "disconnected" }));
		};
	}

	function sendClient(msg: ClientMsg) {
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			console.log("[ws] send dropped (not open):", msg);
			return;
		}

		const parsed = ClientMsgSchema.safeParse(msg);
		if (!parsed.success) {
			console.log("[ws] send dropped (invalid ClientMsg):", msg, parsed.error.format());
			return;
		}

		ws.send(JSON.stringify(parsed.data));
	}

	function disconnect() {
		console.log("[ws] disconnect");
		ws?.close(WS_CLOSE_NORMAL, "client disconnect");
		ws = null;
		lastLoggedPhase = null;
		lastLoggedLobbyTimer = null;
		lastLoggedAfkTimer = null;

		set({ ...INITIAL_STATE });
	}

	function forceDisconnect(reason = "forced") {
		console.log("[ws] forceDisconnect", { reason });

		try {
			if (ws) {
			try { ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null as any; } catch {}
			try { ws.close(1000, reason); } catch {}
			ws = null;
			}
		} finally {
			update((s) => ({ ...s, status: "disconnected" }));
			connect();
		}
	}

	function mergeSegments(
		prev: WSStoreState["segments"],
		prevLastSegI: number | null,
		incoming: WSStoreState["segments"]
	) {
		// No segments yet
		if (prevLastSegI == null || prev.length === 0) {
			const last = incoming.length ? incoming[incoming.length - 1].i : null;
			return { segments: incoming, lastSegI: last };
		}

		// Incomming window is behind
		const incomingFirstI = incoming.length ? incoming[0].i : null;
		if (incomingFirstI == null)
			return { segments: incoming, lastSegI: prevLastSegI };

		// There is a gap
		if (prevLastSegI < incomingFirstI - 1) {
			const last = incoming[incoming.length - 1].i;
			return { segments: incoming, lastSegI: last };
		}

		// Append new segments
		const byI = new Map<number, number>();
		for (let idx = 0; idx < prev.length; idx++)
			byI.set(prev[idx].i, idx);

		const next = prev.slice();

		for (const seg of incoming) {
			const existingIdx = byI.get(seg.i);
			if (existingIdx != null) {
				next[existingIdx] = seg;
			} else if (seg.i > prevLastSegI) {
				next.push(seg);
			}
		}

		const last = next.length ? next[next.length - 1].i : prevLastSegI;
		return { segments: next, lastSegI: last };
	}


	/* ========================================================================== */
	/*                                COMMANDS                                    */
	/* ========================================================================== */

	function createOrJoinRoom(roomId: string, seed: number, player: Player) {
		console.log("[ws] createOrJoinRoom", { roomId, playerId: player.playerId });

		const token = loadResumeToken(roomId);

		update((s) => ({
			...s,
			...ROOM_SESSION_DEFAULTS,
			roomId,
			playerId: player.playerId,
			pendingCreateOrJoin: { roomId, seed, player },
		}));

		if (!ws || ws.readyState !== WebSocket.OPEN) {
			console.log("[ws] createOrJoinRoom queued (ws not open)");
			connect();
			return;
		}

		console.log("[ws] createOrJoinRoom sending immediately");
		sendClient({
			type: "create_or_join_room",
			roomId,
			seed,
			player,
			...(token ? { resumeToken: token } : {}),
		});
	}

	function updatePlayerScene(
		roomId: string,
		playerId: string,
		scene: "lobby" | "game"
	) {
		console.log("[ws] updatePlayerScene", { roomId, playerId, scene });

		// If we cannot send right now, queue it.
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			update((s) => ({ ...s, pendingScene: { roomId, playerId, scene } }));
			console.log("[ws] updatePlayerScene queued (ws not open)");
			connect();
			return;
		}

  		// If we can send immediately, don't leave stale pending state behind.
		update((s) => ({ ...s, pendingScene: null }));

		console.log("[ws] updatePlayerScene sending immediately");
		sendClient({ type: "update_scene", roomId, playerId, scene });
	}
	
	function startGame() {
		const s = get(store);

		if (!s.roomId) {
			console.log("[ws] startGame aborted (no roomId)");
			return;
		}
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			console.log("[ws] startGame aborted (ws not open)");
			return;
		}
		
		console.log("[ws] startGame", { roomId: s.roomId });
		sendClient({ type: "start_game", roomId: s.roomId });
	}

	function leaveRoom() {
		const s = get(store);
		console.log("[ws] leaveRoom", { roomId: s.roomId, playerId: s.playerId });

		if (s.roomId) clearResumeToken(s.roomId);

		if (ws && ws.readyState === WebSocket.OPEN && s.roomId && s.playerId) {
			sendClient({ type: "leave_room", roomId: s.roomId, playerId: s.playerId });
		}

		update((x) => ({
			...x,
			...ROOM_SESSION_DEFAULTS,
			roomId: null,
			playerId: null,
			playerMetaById: {},
			pendingCreateOrJoin: null,
		}));
	}


	/* ========================================================================== */
	/*                                GETTERS                                     */
	/* ========================================================================== */

	function getRoomPlayerIds() {
		return get(store).latestState?.playerIds ?? [];
	}

	function getSceneById() {
		return get(store).latestState?.sceneById ?? {};
	}

	function getHostId() {
		return get(store).latestState?.hostId ?? null;
	}

	function setPlayerMeta(playerId: string, meta: PlayerMeta) {
		const id = String(playerId);

		update((s) => {
			const prev = s.playerMetaById[id];
			if (
				prev &&
				prev.name === meta.name &&
				(prev.avatar_url ?? null) === (meta.avatar_url ?? null)
				) {
					return (s);
			}

			return {
				...s,
				playerMetaById: { ...s.playerMetaById, [id]: meta },
			};
		});
	}

	return {
		subscribe,
		connect,
		createOrJoinRoom,
		updatePlayerScene,
		startGame,
		disconnect,
		sendClient,
		leaveRoom,
		getRoomPlayerIds,
		getSceneById,
		getHostId,
		setPlayerMeta,
		forceDisconnect,
	};
}

export const wsStore = createWebSocketStore();
