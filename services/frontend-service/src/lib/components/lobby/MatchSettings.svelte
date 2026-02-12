<script lang="ts">
  import { goto } from "$app/navigation";
  import ActionButton from "$lib/components/common/ActionButton.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import type { Game } from "$lib/types/types";
  import { userStore } from "$lib/stores/user";
  import { wsStore } from "$lib/stores/ws";

  interface Props {
    // onStartGame?: () => void;
    game: Game;
    // onLeaveGame?: () => void;
    isHost?: boolean;
  }

  let userId = $userStore?.id;
  let { game, isHost: _isHost = false }: Props = $props();
  // Explicitly mark isHost as intentionally unused (possible future feature)

  // TODO: Implement host check logic
  // const isHost = $derived(lobby.players[0]?.id === $apiStore.user?.id);

  // const handleStartGame = () => {
  // 	if (onStartGame) {
  // 		onStartGame();
  // 	}
  // };

//   const handleLeaveGame = () => {
//     if (onLeaveGame) {
//       onLeaveGame();
//     }
//   };

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
</script>

<div class="glass h-ranking rounded-2xl w-full flex flex-col">
  <!-- Header -->
  <div class="flex flex-col gap-2.5 px-6 pt-6">
    <p class="text-xs font-bold text-[#888] uppercase">Match Settings</p>
    <div class="h-px w-full bg-white/10"></div>
  </div>

  <!-- Content - Centered Buttons -->
  <div class="flex-1 flex items-center justify-center">
    <div class="flex flex-col gap-6 items-center w-85">
      <!-- IF we want to make a version that allows for a specific host the
			we can uncomment the code below -->
      <!-- Start Game Button - Only visible for host -->
      <!-- {#if isHost} -->
      <!-- <ActionButton text="START GAME" variant="primary" onclick={handleStartGame} /> -->
      <!-- {/if} -->

      <!-- Start Game Button -->
      <ActionButton
        text="START GAME"
        variant="primary"
        onclick={() => goto(`/game/${game!.id}?playerId=${userId}`)}
      />

      <!-- Leave Game Button -->
      <ActionButton
        text="LEAVE GAME"
        variant="destructive"
        onclick={leaveRoom}
      />
    </div>
  </div>

  <!-- Footer -->
  <div class="px-6 pt-6 pb-6">
    <Footer textSize="card" />
  </div>
</div>
