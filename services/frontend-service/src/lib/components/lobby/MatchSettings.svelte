<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import ActionButton from "$lib/components/common/ActionButton.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import type { Game } from "$lib/types/types";
  import { userStore } from "$lib/stores/user";
  import { wsStore } from "$lib/stores/ws";

  interface Props {
    game: Game;
    isHost?: boolean;
    playerCount: number;
  }

  let userId = $userStore?.id;
  let { game, isHost: _isHost = false, playerCount }: Props = $props();
  let isTooSmall = $state(false);

  onMount(() => {
    const mq = window.matchMedia("(max-width: 1279px)");

    const update = () => {
      isTooSmall = mq.matches;
    };

    update();

    const add = (mq as MediaQueryList & { addListener?: (cb: () => void) => void }).addListener;
    const remove = (mq as MediaQueryList & { removeListener?: (cb: () => void) => void }).removeListener;

    if (mq.addEventListener) mq.addEventListener("change", update);
    else add?.call(mq, update);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else remove?.call(mq, update);
    };
  });

  // Protect start game
  const warnings = $derived(() => {
    const w: string[] = [];

    if (isTooSmall) {
      w.push("Screen too small to start a match. Please widen your window (≥ 1280px).");
    }

    if (playerCount <= 1) {
      w.push("Need at least 2 players to start.");
    }

    if (playerCount > 4) {
      w.push("Too many players. Maximum is 4.");
    }

    return (w);
  });

  const canStart = $derived(() => warnings().length === 0);


  function leaveRoom() {
    if (!game) return;

    fetch(`/api/games/${game.id}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ user_id: userId }),
    })
      .then(() => {
        wsStore.leaveRoom();
        wsStore.disconnect();
        goto("/");
      })
      .catch((err) => console.error("Error informing backend of leaving the game:", err));
  }

  function startGame() {
    if (!canStart()) return;
    goto(`/game/${game!.id}?playerId=${userId}`);
  }
</script>

<div class="glass h-ranking rounded-2xl w-full flex flex-col">
  <!-- Header -->
  <div class="flex flex-col gap-2.5 px-6 pt-6">
    <p class="text-xs font-bold text-[#888] uppercase">Match Settings</p>
    <div class="h-px w-full bg-white/10"></div>
  </div>

  <!-- Content -->
  <div class="flex-1 flex items-center justify-center">
    <div class="flex flex-col gap-6 items-center w-85">

      <!-- Start Warning -->
      {#if warnings().length > 0}
        <div
          class="w-full rounded-xl border border-yellow-400/60 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-400"
        >
          <ul class="list-disc pl-5 space-y-1">
            {#each warnings() as msg}
              <li> ⚠️ {msg}</li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if warnings().length === 0}
        <div class="w-full flex justify-center">
          <ActionButton
            text="START GAME"
            variant="primary"
            onclick={startGame}
          />
        </div>
      {/if}

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
