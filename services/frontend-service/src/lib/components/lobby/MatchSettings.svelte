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

  type Notice = { title: string; body: string };


  let userId = $userStore?.id;
  let { game, isHost: _isHost = false, playerCount }: Props = $props();
  let isTooSmall = $state(false);

  // Timer
  const lobbyTimer = $derived(() => $wsStore.lobbyTimer);
  const lobbySecondsLeft = $derived(() => lobbyTimer()?.secondsLeft ?? null);

  // Warnings
  const warningNotices = $derived((): Notice[] => {
    const out: Notice[] = [];

    if (isTooSmall) {
      out.push({
        title: "Screen too small",
        body: "Please widen your window (≥ 1280px) to start a match.",
      });
    }

    if (playerCount <= 1) {
      out.push({
        title: "Not enough players",
        body: "Need at least 2 players to start.",
      });
    }

    if (playerCount > 4) {
      out.push({
        title: "Too many players",
        body: "Maximum is 4.",
      });
    }

    return out;
  });

  const hasWarnings = $derived(() => warningNotices().length > 0);
  const canStart = $derived(() => !hasWarnings());


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
    <p class="text-xs font-bold text-[#888] uppercase">Lobby Info</p>
    <div class="h-px w-full bg-white/10"></div>
  </div>

  <!-- Content -->
  <div class="flex-1 px-6 py-6">
    <div class="h-full w-full max-w-[28rem] mx-auto flex flex-col">

      <!-- Timer -->
      <div class="w-full space-y-2">
        {#if lobbySecondsLeft() !== null}
          <div class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-[#888] uppercase">Lobby Life-Span</p>
              <p class="text-sm font-semibold text-white">
                {lobbySecondsLeft()}s
              </p>
            </div>
            <p class="mt-1 text-sm text-white/60">
              Players who have not entered the game will be removed when this reaches 0.
            </p>
          </div>
        {/if}

      <!-- Warnings -->
        {#if hasWarnings()}
          <div class="w-full space-y-2">
            {#each warningNotices() as w}
              <div class="rounded-xl border border-yellow-400/60 bg-yellow-400/10 px-4 py-3">
                <p class="text-xs font-bold text-yellow-300 uppercase">{w.title}</p>
                <p class="mt-1 text-sm text-yellow-200/90">{w.body}</p>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Buttons -->
      <div class="mt-auto flex flex-col gap-4 items-center">
        {#if !hasWarnings()}
          <ActionButton
            text="ENTER GAME"
            variant="primary"
            onclick={startGame}
            class="w-full max-w-[16rem]"
          />
        {/if}

        <ActionButton
          text="LEAVE GAME"
          variant="destructive"
          onclick={leaveRoom}
          class="w-full max-w-[16rem]"
        />
      </div>

    </div>
  </div>

  <!-- Footer -->
  <div class="px-6 pt-6 pb-6">
    <Footer textSize="card" />
  </div>
</div>
