import { browser } from '$app/environment';
import { writable } from 'svelte/store';

interface WSMessage {
  type: string;
  [key: string]: any;
}

interface WSStore {
  ws: WebSocket | null;
  connected: boolean;
  messages: WSMessage[];
}

//TODO: BIG REFACTOR
function createWebSocketStore() {
  const { subscribe, set, update } = writable<WSStore>({
    ws: null,
    connected: false,
    messages: []
  });

  let ws: WebSocket | null = null;

  function makeWsUrl() {
    if (! browser) return '';
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    return `${proto}://${window.location.host}/ws`;
  }

  function connect() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    ws = new WebSocket(makeWsUrl());
    console.log("Connecting to WebSocket at", makeWsUrl());
    ws.onopen = () => {
      console.log("WebSocket connected");
      update(store => ({ ...store, ws, connected: true }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      console.log("Received WS message:", msg);
      update(store => ({ 
        ...store, 
        messages: [...store.messages, msg] 
      }));
    };

    ws.onerror = () => {
      update(store => ({ ...store, connected: false }));
    };

    ws.onclose = () => {
      update(store => ({ ...store, ws: null, connected: false }));
      ws = null;
    };
  }

  function safeSend(obj: unknown) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
      console.log("Sent WS message:", obj);
    }
  }

  function disconnect() {
    if (ws) {
      ws.close();
      ws = null;
    }
    set({ ws: null, connected: false, messages: [] });
  }

  return {
    subscribe,
    connect,
    safeSend,
    disconnect
  };
}

export const wsStore = createWebSocketStore();