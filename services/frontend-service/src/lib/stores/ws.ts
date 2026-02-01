
import { browser } from "$app/environment";
import { writable, get } from "svelte/store";
import {
	ClientMsgSchema,
	ServerMsgSchema,
	type ClientMsg,
	type ServerMsg
} from "@ft/game-ws-protocol";

type StateMsg = Extract<ServerMsg, { type: "state" }>;

type WSStoreState = {
	status: "disconnected" | "connecting" | "open" | "error";
	messages: ServerMsg[];
	latestState: StateMsg["snapshot"] | null;
	roomId: string | null;
	playerId: string | null;
	pendingCreate: { roomId: string; seed: number; playerId: string } | null;
	pendingJoin: { roomId: string; playerId: string } | null;
	pendingScene: { roomId: string; playerId: string; scene: "lobby" | "game" } | null;
};

function makeWsUrl() {
	if (!browser) return "";
	const proto = window.location.protocol === "https:" ? "wss" : "ws";
	return `${proto}://${window.location.host}/ws`;
}

function createWebSocketStore() {
	const store = writable<WSStoreState>({
		status: "disconnected",
		messages: [],                         // TODO: Use stack
		latestState: null,
		roomId: null,
		playerId: null,
		pendingCreate: null,
		pendingJoin: null,
		pendingScene: null,
	});

	const { subscribe, set, update } = store;
	let ws: WebSocket | null = null;

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

			if (s.pendingCreate) {
				const { roomId, seed, playerId } = s.pendingCreate;
				sendClient({ type: "create_room", roomId, seed, players: [{ playerId }] });
				update((x) => ({ ...x, pendingCreate: null }));
			}

			if (s.pendingJoin) {
				joinRoom(s.pendingJoin.roomId, s.pendingJoin.playerId);
				update((x) => ({ ...x, pendingJoin: null }));
			}

			if (s.pendingScene) {
				const { roomId, playerId, scene } = s.pendingScene;
				sendClient({ type: "update_scene", roomId, playerId, scene });
				update((x) => ({ ...x, pendingScene: null }));
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

	function joinRoom(roomId: string, playerId: string) {
		update((s) => ({ ...s, roomId, playerId }));

		if (!ws || ws.readyState !== WebSocket.OPEN) {
			update((s) => ({ ...s, pendingJoin: { roomId, playerId } }));
			connect();
			return;
		}

		sendClient({ type: "join_room", roomId, playerId });
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
			pendingJoin: null,
			pendingScene: null,
		}));
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
			pendingCreate: null,
			pendingJoin: null,
			pendingScene: null,
		});
	}

	function createRoom(roomId: string, seed: number, playerId: string) {
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			update((s) => ({ ...s, pendingCreate: { roomId, seed, playerId } }));
			connect();
			return;
		}

		console.log("Creating room");

		sendClient({
			type: "create_room",
			roomId,
			seed,
			players: [{ playerId }],
		});
	}

	return {
		subscribe,
		connect,
		createRoom,
		updatePlayerScene,
		startGame,
		disconnect,
		sendClient,
		joinRoom,
		leaveRoom,
	};
}

export const wsStore = createWebSocketStore();
