<script lang="ts">
  import type { Game } from "$lib/types/types";
  import { userStore } from "$lib/stores/user.js";
	import { apiStore } from "$lib/stores/api";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { wsStore } from "$lib/stores/ws";

	let { data } = $props();
	let game = $state(null as Game | null);
	let api = apiStore;
	let joined = $state(false);
  let userId = $userStore?.id;

	$effect(() => {
		const last = $wsStore.messages?.[$wsStore.messages.length - 1];		// TODO: Use messages.pop()
		const type = last?.type;

		if (type === "joined" || type === "left") {
			console.log("Lobby detected join/leave, refetching game data.");
			fetchGameData();
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

			if (!joined) {
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
				wsStore.leaveRoom();
				wsStore.disconnect();
				goto("/");
			})
			.catch((err) => {
        console.error("Error informing backend of leaving the game:", err);
      });
  }

	function joinRoom() {
		if (!game) {
			console.log("ERROR: joinGame() - No game object");
			return;
		}

		const playerId = userId;
		if (playerId == null)
		{
			console.log("ERROR: joinGame() - player ID null");
			return;
		}
		
		if (game.users.length === 1 && game.users[0].id === playerId) {
			wsStore.createRoom(data.lobbyId, 1, String(playerId));
		}
		wsStore.joinRoom(data.lobbyId, String(playerId));
	}

	onMount(() => {
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
		<ul class="my-4 space-y-2">
			{#each game.users as user}
				<li>{user.name}</li>
			{/each}
		</ul>

  <button onclick={() => goto(`/game/${game!.id}?playerId=${userId}`)}>
    Start Game
  </button>

  <button onclick={leaveRoom}>
    Leave Game
  </button>
  
	</div>
{:else}
	<p>Loading game data...</p>
{/if}
