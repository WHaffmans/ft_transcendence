<script lang="ts">
  import { goto } from "$app/navigation";
  import ActionButton from "$lib/components/common/ActionButton.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import type { Game } from "$lib/types/types";
  import { userStore } from "$lib/stores/user";
  import { wsStore } from "$lib/stores/ws";

  interface Props {
    game: Game;
    isHost?: boolean;
  }

  let userId = $userStore?.id;
  let { game, isHost: _isHost = false }: Props = $props();

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

      <!-- Warning only on small screens -->
      <div class="xl:hidden w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
        Screen too small to start a match.
        <span class="text-white/60">Please widen your window (≥ 1280px).</span>
      </div>

      <!-- Start Game Button -->
      <div class="hidden xl:flex w-full justify-center">
        <ActionButton
          text="START GAME"
          variant="primary"
          onclick={() => goto(`/game/${game!.id}?playerId=${userId}`)}
        />
      </div>

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
