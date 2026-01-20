<script lang="ts">
  import { apiStore } from "$lib/stores/api";
  import type { Game } from "$lib/types/types";

  let { data } = $props();
  let game = $state({} as Game | null);

  let api = apiStore;
  api.fetchApi(`/games/${data.lobbyId}`).then((data) => {
    game = data;
    console.log("Lobby page loaded with data:", data);
  });
</script>

<title>Lobby</title>

<h1>Lobby Page</h1>
<p>This is the lobby page for ID: {data.lobbyId}</p>

{#if game?.id}
  <div>
    <p>Game Status: {game.status}</p>
    <br />
    <span>Connected players:</span>
    <ul class="space-y-2 my-4">
      {#each game.users as user}
        <li>{user.name}</li>
      {/each}
    </ul>
    <button onclick={() => alert("You cannot do that yet")}>Start Game</button>
  </div>
{:else}
  <p>Loading game data...</p>
{/if}
