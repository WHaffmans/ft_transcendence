<script lang="ts">
  import type { Game } from "$lib/types/types";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { wsStore } from "$lib/stores/ws.js";
  import { get } from "svelte/store";
  import { userStore } from "$lib/stores/user.js";

  let { data } = $props();

  let game = $state(null as Game | null);
  let joined: boolean = false;

  let userId = get(userStore)?.id;

  $effect(() => {
    let msg = $wsStore.messages.shift();
    if (!msg) return;
    if (msg.type === "joined" || msg.type === "left") {
      console.log(
        "Lobby page detected join/leave message, fetching game data again.",
      );
      fetchGameData();
    }
    if (msg.type === "started") {
      console.log("Game started, navigating to game page.");
      goto(`/game/${data.lobbyId}`);
    }
  });

  async function fetchGameData() {
    try {
      const response = await fetch(`/api/games/${data.lobbyId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const gameData = await response.json();
      console.log("Fetched game data:", gameData);
      game = gameData;

      if ($wsStore.connected && !joined) {
        joinRoom();
        joined = true;
      }
    } catch (err) {
      console.error("Error fetching game data:", err);
    }
  }

  function leaveRoom() {
    if (!game) {
      console.error("Game data not loaded yet.");
      return;
    }
    fetch(`/api/games/${game.id}/leave`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        user_id: userId,
      }),
    })
      .then(() => {
        console.log("Successfully informed backend of leaving the game.");
        wsStore.safeSend({
          type: "leave_room",
          room_id: data.lobbyId,
        });
        wsStore.disconnect();
        goto("/");
      })
      .catch((err) => {
        console.error("Error informing backend of leaving the game:", err);
      });
  }

  function joinRoom() {
    if (!game) {
      console.error("Game data not loaded yet.");
      return;
    }

    if (game.users.length == 1 && game.users[0].id == userId) {
      wsStore.safeSend({
        type: "create_room",
        room_id: data.lobbyId,
        seed: 1,
        players: [{ playerId: userId }],
      });
    }

    wsStore.safeSend({
      type: "join_room",
      room_id: data.lobbyId,
      playerId: userId,
    });
  }

  function startGame() {
    wsStore.safeSend({ type: "start", room_id: data.lobbyId });
  }

  onMount(() => {
    console.log("Lobby page mounted with ID:", data.lobbyId);
    wsStore.connect();
    fetchGameData();
  });
</script>

<title>Lobby</title>

<h1>Lobby Page</h1>
<p>This is the lobby page for ID: {data.lobbyId}</p>

{#if game && game.id}
  <div>
    <p>Game Status: {game.status}</p>
    <br />
    <span>Connected players:</span>
    <ul class="space-y-2 my-4">
      {#each game.users as user}
        <li>{user.name}</li>
      {/each}
    </ul>
    <button onclick={() => startGame()}>Start Game</button>
    <button onclick={() => leaveRoom()}>Leave Game</button>
  </div>
{:else}
  <p>Loading game data...</p>
{/if}
