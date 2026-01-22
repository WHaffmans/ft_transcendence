<script lang="ts">
  import { apiStore } from "$lib/stores/api";
  import type { Game } from "$lib/types/types";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { wsStore } from "$lib/stores/ws.js";

  let { data } = $props();
  let game = $state(null as Game | null);
  let api = apiStore;
  let joined: boolean = false;

  $effect(() => {
    let msg = $wsStore.messages.shift();
    if (!msg) return;
    if (msg.type === "joined" || msg.type === "left") {
      console.log(
        "Lobby page detected join/leave message, fetching game data again.",
      );
      fetchGameData();
    }
  });

  async function fetchGameData() {
    try {
      const gameData = await api.fetchApi(`/games/${data.lobbyId}`);
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
    api
      .fetchApi(`/games/${game.id}/leave`, "POST", {
        user_id: $apiStore.user?.id,
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

    if (game.users.length == 1 && game.users[0].id == $apiStore.user?.id) {
      wsStore.safeSend({
        type: "create_room",
        room_id: data.lobbyId,
        seed: 1,
        players: [{ playerId: $apiStore.user?.id }],
      });
    }

    wsStore.safeSend({
      type: "join_room",
      room_id: data.lobbyId,
      playerId: $apiStore.user?.id,
    });
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
    <button onclick={() => goto(`/game/${game!.id}`)}>Start Game</button>
    <button onclick={() => leaveRoom()}>Leave Game</button>
  </div>
{:else}
  <p>Loading game data...</p>
{/if}
