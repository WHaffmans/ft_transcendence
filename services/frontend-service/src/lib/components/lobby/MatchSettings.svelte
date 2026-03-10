<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import ActionButton from "$lib/components/common/ActionButton.svelte";
  import { wsStore } from "$lib/stores/ws";
  import { modalStore } from "$lib/components/modal/modal";

  interface Props {
    playerCount: number;
    lobbyId: string;
    playerId: string;
    sceneById: Record<string, string>;
    onLeave?: () => void;
  }

  type Notice = { title: string; body: string };

  let {
    playerCount,
    lobbyId,
    playerId,
    sceneById,
    onLeave,
  }: Props = $props();

  let isTooSmall = $state(false);
  let isTooShort = $state(false);

  // Timer
  const lobbyTimer = $derived($wsStore.lobbyTimer);
  const lobbySecondsLeft = $derived(lobbyTimer?.secondsLeft ?? null);
  const afkTimer = $derived($wsStore.afkTimer);
  let afkSecondsLeft = $state<number | null>(null);

  $effect(() => {
    const timer = afkTimer;
    if (!timer) { afkSecondsLeft = null; return; }
    const tick = () => {
      const secs = Math.ceil((timer.deadlineAtMs - Date.now()) / 1000);
      afkSecondsLeft = (secs > 0 && secs <= 60) ? secs : null;
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  });

  onMount(() => {
    const mqWidth = window.matchMedia("(max-width: 1279px)");
    const mqHeight = window.matchMedia("(max-height: 809px)");

    const updateWidth = () => {
      isTooSmall = mqWidth.matches;
    };
    const updateHeight = () => {
      isTooShort = mqHeight.matches;
    };

    updateWidth();
    updateHeight();

    const addW = (mqWidth as MediaQueryList & { addListener?: (cb: () => void) => void }).addListener;
    const removeW = (mqWidth as MediaQueryList & { removeListener?: (cb: () => void) => void }).removeListener;
    const addH = (mqHeight as MediaQueryList & { addListener?: (cb: () => void) => void }).addListener;
    const removeH = (mqHeight as MediaQueryList & { removeListener?: (cb: () => void) => void }).removeListener;

    if (mqWidth.addEventListener) mqWidth.addEventListener("change", updateWidth);
    else addW?.call(mqWidth, updateWidth);

    if (mqHeight.addEventListener) mqHeight.addEventListener("change", updateHeight);
    else addH?.call(mqHeight, updateHeight);

    return () => {
      if (mqWidth.removeEventListener) mqWidth.removeEventListener("change", updateWidth);
      else removeW?.call(mqWidth, updateWidth);

      if (mqHeight.removeEventListener) mqHeight.removeEventListener("change", updateHeight);
      else removeH?.call(mqHeight, updateHeight);
    };
  });

  /* ====================================================================== */
  /*                              READY STATE                               */
  /* ====================================================================== */

  const myScene = $derived(sceneById[playerId] ?? "lobby");
  const isReady = $derived(myScene === "game");
  const canReady = $derived(!isTooSmall && !isTooShort);

  function toggleReady() {
    if (!isReady && !canReady) return;
    const nextScene = isReady ? "lobby" : "game";
    wsStore.updatePlayerScene(lobbyId, playerId, nextScene);
  }

  // Warnings
  const warningNotices = $derived.by((): Notice[] => {
    const out: Notice[] = [];

    if (isTooSmall) {
      out.push({
        title: "Screen too narrow",
        body: "Please widen your window (≥ 1280 px) to start a match.",
      });
    }

    if (isTooShort) {
      out.push({
        title: "Screen too short",
        body: "Please increase your window height (≥ 810 px) to start a match.",
      });
    }

    if (playerCount <= 1) {
      out.push({
        title: "Waiting for players",
        body: "At least 2 players needed to start a match.",
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

  function handleEnter(e: KeyboardEvent) {
    if (e.key !== 'Enter') return;
    if ($modalStore.type) return;
    if (!isReady && !canReady) return;
    toggleReady();
  }

  /* ====================================================================== */
  /*                              LEAVE                                     */
  /* ====================================================================== */

  function leaveRoom() {
    if (onLeave) {
      onLeave();
    } else {
      wsStore.leaveRoom();
      wsStore.disconnect();
      goto("/");
    }
  }
</script>

<svelte:window onkeydown={handleEnter} />

<div class="glass h-ranking rounded-2xl w-full flex flex-col">
  <!-- Header -->
  <div class="flex flex-col gap-2.5 px-6 pt-6">
    <p class="text-xs font-bold text-[#888] uppercase">Lobby Info</p>
    <div class="h-px w-full bg-white/10"></div>
  </div>

  <!-- Content -->
  <div class="flex-1 px-6 py-6">
    <div class="h-full w-full max-w-md mx-auto flex flex-col">

      <!-- Timer + Warnings -->
      <div class="w-full space-y-2">
        {#if lobbySecondsLeft !== null}
          <div class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-[#888] uppercase">Lobby Life-Span</p>
              <p class="text-sm font-semibold text-white">
                {lobbySecondsLeft}s
              </p>
            </div>
            <p class="mt-1 text-sm text-white/60">
              Game will auto-start when this reaches 0. Non-ready players will be removed.
            </p>
          </div>
        {/if}

        {#if afkSecondsLeft !== null}
          <div class="w-full rounded-xl border border-orange-400/60 bg-orange-400/10 px-4 py-3">
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold text-orange-300 uppercase">AFK Warning</p>
              <p class="text-sm font-semibold text-orange-200">
                {afkSecondsLeft}s
              </p>
            </div>
            <p class="mt-1 text-sm text-orange-200/80">
              You'll be removed for inactivity. Ready up to stay in the lobby.
            </p>
          </div>
        {/if}

        {#if warningNotices.length > 0}
          <div class="w-full space-y-2">
            {#each warningNotices as w}
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
        <!-- READY toggle (all players) -->
        {#if isReady}
          <ActionButton
            text="CANCEL READY"
            variant="destructive"
            onclick={toggleReady}
            class="w-full max-w-[16rem]"
          />
        {:else}
          <ActionButton
            text="READY UP"
            variant="primary"
            disabled={!canReady}
            onclick={toggleReady}
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

</div>
