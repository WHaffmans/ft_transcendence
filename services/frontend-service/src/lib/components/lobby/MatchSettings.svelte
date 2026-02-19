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
    isHost: boolean;
    playerCount: number;
    lobbyId: string;
    playerId: string;
    sceneById: Record<string, string>;
    hostId: string | null;
  }

  let {
    game,
    isHost,
    playerCount,
    lobbyId,
    playerId,
    sceneById,
    hostId,
  }: Props = $props();

  let userId = $userStore?.id;
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

  /* ====================================================================== */
  /*                          READY STATE (non-host)                        */
  /* ====================================================================== */

  const myScene = $derived(sceneById[playerId] ?? "lobby");
  const isReady = $derived(myScene === "game");

  function toggleReady() {
    const nextScene = isReady ? "lobby" : "game";
    wsStore.updatePlayerScene(lobbyId, playerId, nextScene);
  }

  /* ====================================================================== */
  /*                         START GAME (host only)                         */
  /* ====================================================================== */

  /** True when every non-host player has scene === "game" */
  const allOthersReady = $derived(() => {
    if (!hostId) return false;
    return Object.entries(sceneById).every(
      ([id, scene]) => id === String(hostId) || scene === "game"
    );
  });

  const warnings = $derived(() => {
    const w: string[] = [];

    if (isTooSmall) {
      w.push("Screen too small to start a match. Please widen your window (≥ 1280 px).");
    }

    if (playerCount <= 1) {
      w.push("Need at least 2 players to start.");
    }

    if (playerCount > 4) {
      w.push("Too many players. Maximum is 4.");
    }

    if (isHost && !allOthersReady()) {
      w.push("Waiting for all players to ready up.");
    }

    return w;
  });

  const canStart = $derived(() => warnings().length === 0);

  function startGame() {
    if (!canStart()) return;
    // Mark host as "game" scene so server transitions lobby → ready,
    // then immediately fire start_game so ready → running.
    wsStore.updatePlayerScene(lobbyId, playerId, "game");
    wsStore.startGame();
  }

  /* ====================================================================== */
  /*                              LEAVE                                     */
  /* ====================================================================== */

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
</script>

<div class="glass h-ranking rounded-2xl w-full flex flex-col">
  <!-- Header -->
  <div class="flex flex-col gap-2.5 px-6 pt-6">
    <p class="text-xs font-bold text-[#888] uppercase">Match Settings</p>
    <div class="h-px w-full bg-white/10"></div>
  </div>

  <!-- Content -->
  <div class="flex-1 flex items-center justify-center px-6">
    <div class="flex flex-col gap-6 items-center w-full max-w-[28rem]">

      <!-- Warnings -->
      {#if warnings().length > 0}
        <div
          class="w-full rounded-xl border border-yellow-400/60 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-400"
        >
          <ul class="list-disc pl-5 space-y-1">
            {#each warnings() as msg}
              <li>⚠️ {msg}</li>
            {/each}
          </ul>
        </div>
      {/if}

      <!-- Host: START GAME button (disabled until all ready) -->
      {#if isHost}
        <div class="w-full flex justify-center">
          <ActionButton
            text="START GAME"
            variant="primary"
            disabled={!canStart()}
            onclick={startGame}
          />
        </div>

      <!-- Non-host: READY toggle -->
      {:else}
        <div class="w-full flex justify-center">
          {#if isReady}
            <ActionButton
              text="CANCEL READY"
              variant="destructive"
              onclick={toggleReady}
            />
          {:else}
            <ActionButton
              text="READY UP"
              variant="primary"
              onclick={toggleReady}
            />
          {/if}
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
