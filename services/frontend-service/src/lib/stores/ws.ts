
import { z } from "zod";
import { browser } from "$app/environment";
import { writable, get } from "svelte/store";
import {
	ClientMsgSchema,
	ServerMsgSchema,
	type ClientMsg,
	type ServerMsg,
	PlayerSchema,
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
	pendingCreateOrJoin: { roomId: string; seed: number; player: Player } | null;
	pendingScene: { roomId: string; playerId: string; scene: "lobby" | "game" } | null;
};

function makeWsUrl() {
	if (!browser) return "";
	const proto = window.location.protocol === "https:" ? "wss" : "ws";
	return `${proto}://${window.location.host}/ws`;
}


/* ========================================================================== */
/*                                  STORE                                     */
/* ========================================================================== */

function createWebSocketStore() {
	const store = writable<WSStoreState>({
		status: "disconnected",
		messages: [],
		latestState: null,
		segments: [],
		lastSegI: null,
		roomId: null,
		playerId: null,
		playerMetaById: {},
		winnerId: null as string | null,
		pendingCreateOrJoin: null,
		pendingScene: null,
	});

	const { subscribe, set, update } = store;
	let ws: WebSocket | null = null;


	/* ========================================================================== */
	/*                                TRANSPORT                                   */
	/* ========================================================================== */

	function connect() {
		if (!browser) return;
		if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

		update((s) => ({ ...s, status: "connecting" }));
		ws = new WebSocket(makeWsUrl());
		console.log("WS connecting to:", makeWsUrl());

		ws.onopen = () => {
			console.log("WS open");
			update((s) => ({ ...s, status: "open" }));

			const s = get(store);

			if (s.pendingCreateOrJoin) {
				const { roomId, seed, player } = s.pendingCreateOrJoin;
				update((x) => ({ ...x, pendingCreateOrJoin: null }));
				sendClient({ type: "create_or_join_room", roomId, seed, player });
			}

			if (s.pendingScene) {
				const { roomId, playerId, scene } = s.pendingScene;
				update((x) => ({ ...x, pendingScene: null }));
				sendClient({ type: "update_scene", roomId, playerId, scene });
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
				console.log("Dropped non-ServerMsg from WS:", raw, parsed.error.format());
				return;
			}

			const msg = parsed.data;
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

					const merged = mergeSegments(s.segments, s.lastSegI, incoming);
					segments = merged.segments;
					lastSegI = merged.lastSegI;
				}

				return {
					...s,
					messages: [...s.messages, msg].slice(-MAX_WS_MESSAGES),
					latestState: isState ? msg.snapshot : s.latestState,

					segments,
					lastSegI,

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
			console.log("WS error", e);
			update((s) => ({ ...s, status: "error" }));
		}

		ws.onclose = (e) => {
			console.log("WS close", e.code, e.reason);
			ws = null;
			update((s) => ({ ...s, status: "disconnected" }));
		};
	}

	function sendClient(msg: ClientMsg) {
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			console.log("WS send dropped (not open):", msg);
			return;
		}

		const parsed = ClientMsgSchema.safeParse(msg);
		if (!parsed.success) {
			console.log("WS send dropped (invalid ClientMsg):", msg, parsed.error.format());
			return;
		}

		console.log("WS send:", parsed.data);
		ws.send(JSON.stringify(parsed.data));
	}

	function disconnect() {
		ws?.close();
		ws = null;

		set({
			status: "disconnected",
			messages: [],
			latestState: null,
			segments: [],
			lastSegI: null,
			roomId: null,
			playerId: null,
			playerMetaById: {},
			winnerId: null,
			pendingCreateOrJoin: null,
			pendingScene: null,
		});
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
		update((s) => ({
			...s,
			roomId,
			playerId: player.playerId,
			playersById: { ...s.playerMetaById, [String(player.playerId)]: player },
	}));

		if (!ws || ws.readyState !== WebSocket.OPEN) {
			update((s) => ({ ...s, pendingCreateOrJoin: { roomId, seed, player } }));
			connect();
			return;
		}

		sendClient({ type: "create_or_join_room", roomId, seed, player });
	}

	function updatePlayerScene(roomId: string, playerId: string, scene: "lobby" | "game" ) {
		update((s) => ({ ...s, pendingScene: { roomId, playerId, scene } }));

		if (!ws || ws.readyState !== WebSocket.OPEN) {
			connect();
			return;
		}

		sendClient({ type: "update_scene", roomId, playerId, scene });
		update((s) => ({ ...s, pendingScene: null }));
	}
	
	
	function startGame() {
		const s = get(store);

		if (!s.roomId)
			return;
		if (!ws || ws.readyState !== WebSocket.OPEN)
			return;
		
		sendClient({ type: "start_game", roomId: s.roomId });
	}

	function leaveRoom() {
		const s = get(store);

		if (ws && ws.readyState === WebSocket.OPEN && s.roomId && s.playerId) {
			sendClient({ type: "leave_room", roomId: s.roomId, playerId: s.playerId });
		}

		update((x) => ({
			...x,
			roomId: null,
			playerId: null,
			latestState: null,
			segments: [],
			lastSegI: null,
			playerMetaById: {},
			winnerId: null,
			pendingCreateOrJoin: null,
			pendingScene: null,
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
	};
}

export const wsStore = createWebSocketStore();
