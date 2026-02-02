<script lang="ts">
  import LobbyGrid from "$lib/components/lobby/LobbyGrid.svelte";
  import PlayerCard from "$lib/components/lobby/PlayerCard.svelte";
  import WaitingCard from "$lib/components/lobby/WaitingCard.svelte";
  import MatchSettings from "$lib/components/lobby/MatchSettings.svelte";
  import { wsStore } from "$lib/stores/ws.js";
  import { userStore } from "$lib/stores/user.js";
  import type { Game } from "$lib/types/types.js";
  import { onMount } from "svelte";

  let { data } = $props();
  let game = $state(null as Game | null);
  let joined = $state(false);
  let userId = $userStore?.id;

  $effect(() => {
    const last = $wsStore.messages?.shift()
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

//   function leaveRoom() {
//     if (!game) {
//       console.error("Game data not loaded yet.");
//       return;
//     }
//     fetch(`/api/games/${game.id}/leave`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       credentials: "include",
//       body: JSON.stringify({
//         user_id: userId,
//       }),
//     })
//       .then(() => {
//         wsStore.leaveRoom();
//         wsStore.disconnect();
//         goto("/");
//       })
//       .catch((err) => {
//         console.error("Error informing backend of leaving the game:", err);
//       });
//   }

  function joinRoom() {
    if (!game) {
      console.log("ERROR: joinGame() - No game object");
      return;
    }

    const playerId = userId;
    if (playerId == null) {
      console.log("ERROR: joinGame() - player ID null");
      return;
    }

    // TODO: I still don't like this logic here
    if (game.users.length === 1 && game.users[0].id === playerId) {
      wsStore.createRoom(data.lobbyId, 1, String(playerId));
    }
    wsStore.joinRoom(data.lobbyId, String(playerId));
  }

  onMount(() => {
    wsStore.connect();
    fetchGameData();
  });
  // Find current user to get their info for navbar
  //   const currentUser = $derived(game?.users.find((p) => p && p.isCurrentUser));

  // Check if current user is host
  //   const isHost = $derived(
  //     game?.users.some((p) => p && p.isCurrentUser && p.status === "host"),
  //   );

//   const handleStartGame = () => {
//     console.log("Starting game...");
//     // TODO: Implement game start logic
//   };

  //   const handleLeaveGame = () => {
  //     console.log("Leaving lobby...");
  //     // TODO: Implement leave lobby logic
  //     goto("/dashboard");
  //   };

  //   const handleLogout = () => {
  //     console.log("Logging out...");
  //     // TODO: Implement logout logic
  //     goto("/");
  //   };
</script>

<svelte:head>
  <title>Lobby - ACHTUNG</title>
</svelte:head>

<section class="relative overflow-hidden">
  <!-- Main content -->
  <div class="flex flex-col items-start justify-between gap-6 lg:flex-row">
    <!-- Left Section - Player Slots -->
    <LobbyGrid>
      {#each game?.users as player}
        {#if player}
          <PlayerCard {player} />
        {:else}
          <WaitingCard />
        {/if}
      {/each}
    </LobbyGrid>

    <!-- Right Section - Match Settings -->
    <div class="w-full lg:w-ranking shrink-0">
      <MatchSettings
        isHost={false}
		game={game!}
      />
    </div>
  </div>
</section>
