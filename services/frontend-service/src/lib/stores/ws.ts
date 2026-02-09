
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

type Player = z.infer<typeof PlayerSchema>;
type StateMsg = Extract<ServerMsg, { type: "state" }>;

type WSStoreState = {
	status: "disconnected" | "connecting" | "open" | "error";
	messages: ServerMsg[];
	latestState: StateMsg["snapshot"] | null;
	roomId: string | null;
	playerId: string | null;
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
// TODO: Use stack for messages

function createWebSocketStore() {
	const store = writable<WSStoreState>({
		status: "disconnected",
		messages: [],
		latestState: null,
		roomId: null,
		playerId: null,
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
			update((s) => ({
				...s,
				messages: [...s.messages, msg].slice(-200),
				latestState: msg.type === "state" ? msg.snapshot : s.latestState,
			}));
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
			roomId: null,
			playerId: null,
			pendingCreateOrJoin: null,
			pendingScene: null,
		});
	}


	/* ========================================================================== */
	/*                                COMMANDS                                    */
	/* ========================================================================== */

	function createOrJoinRoom(roomId: string, seed: number, player: Player) {
		update((s) => ({ ...s, roomId, playerId: player.playerId }));

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
	};
}

export const wsStore = createWebSocketStore();
