<script lang="ts">
  import { onMount, onDestroy, untrack } from "svelte";
  import { goto } from "$app/navigation";
  import { wsStore } from "$lib/stores/ws";
  import { toast } from "svelte-sonner";

  import PlayersPanel from "$lib/components/game/PlayersPanel.svelte";
  import GameCanvas from "$lib/components/game/GameCanvas.svelte";
  import FinishOverlay from "$lib/components/game/FinishOverlay.svelte";
  import StartOverlay from "$lib/components/game/StartOverlay.svelte";

  import { createCanvasRenderer } from "$lib/game/renderCanvas";
  import { createGameMetaLoader } from "$lib/game/gameMeta";
  import { createFinishRedirect } from "$lib/game/finishRedirect";

  /* ============================================================================
   * DOM refs + Handles
   * ========================================================================== */
  let canvas = $state<HTMLCanvasElement | null>(null);
  let stopRender: null | (() => void) = null;
  let stopFinishWatch: null | (() => void) = null;

  let didLeave = $state(false);

  function stopLocal() {
    stopRender?.();
    stopRender = null;

    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);

    stopFinishWatch?.();
    stopFinishWatch = null;
  }

  async function leaveAndGoDashboard() {
    if (didLeave) return;
    didLeave = true;

    stopLocal();

    try {
      wsStore.leaveRoom?.();
      const roomId = $wsStore.roomId;
      const playerId = $wsStore.playerId;
      if (roomId && playerId) wsStore.updatePlayerScene(roomId, playerId, "lobby");
    } catch (err) {
      console.warn("leave failed", err);
    } finally {
      goto("/dashboard", { replaceState: true });
    }
  }

  /* ============================================================================
   * Derived UI state (RUNES)
   * ========================================================================== */
  const snapshot = $derived($wsStore.latestState);
  const phase = $derived(snapshot?.phase ?? null);

  const showStartOverlay = $derived(phase === "lobby" || phase === "ready");

  const showFinishedOverlay = $derived(phase === "finished");

  const isHost = $derived.by(() => {
    const s = snapshot;
    const y = youId;
    return !!s?.hostId && !!y && String(s.hostId) === String(y);
  });

  // Player list/meta
  const youId = $derived($wsStore.playerId ? String($wsStore.playerId) : null);
  const players = $derived(snapshot?.players ?? []);
  const metaById = $derived($wsStore.playerMetaById ?? {});

  const winnerId = $derived($wsStore.winnerId ?? null);
  const winnerName = $derived.by(() => {
    const id = winnerId;
    return id ? displayName(String(id)) : "No winner";
  });
  const winnerAvatar = $derived.by(() => {
    const id = winnerId;
    return id ? avatarUrl(String(id)) : null;
  });

  $effect(() => {
    if (showFinishedOverlay) {
      untrack(() => {
        console.log("winner", {
          winnerId: winnerId,
          winnerName: winnerName,
          winnerAvatar: winnerAvatar,
          meta: metaById[String(winnerId ?? "")],
        });
      });
    }
  });

  function displayName(playerId: string) {
    return metaById[String(playerId)]?.name ?? `Player ${playerId}`;
  }

  function avatarUrl(playerId: string) {
    return metaById[String(playerId)]?.avatar_url ?? null;
  }

  // Meta loader
  const metaLoader = createGameMetaLoader(wsStore, {
    defaultAvatar: "/placeholders/avatars/avatar_placeholder.webp",
  });

  $effect(() => {
    metaLoader.ensureLoaded($wsStore.roomId);
  });

  // Finish overlay redirect
  const finish = createFinishRedirect({
    seconds: 10,
    isFinished: () => showFinishedOverlay,
    onDone: () => goto("/dashboard", { invalidateAll: true }),
  });
  const countdown = finish.countdown;

  function goDashboard() {
    goto("/dashboard", { invalidateAll: true });
  }

  /* ============================================================================
   * Inputs
   * ========================================================================== */
  function handleCountdownEnd() {
    if (isHost && $wsStore.status === "open" && $wsStore.roomId) {
      wsStore.startGame();
    }
  }

  function onKeyDown(ev: KeyboardEvent) {
    if (ev.code === "Space") {
      ev.preventDefault();
      return;
    }

    if (phase !== "running") return;

    if (ev.key === "ArrowLeft") {
      if ($wsStore.status === "open" && $wsStore.roomId) {
        wsStore.sendClient({ type: "input", turn: -1 });
      }
    }

    if (ev.key === "ArrowRight") {
      if ($wsStore.status === "open" && $wsStore.roomId) {
        wsStore.sendClient({ type: "input", turn: 1 });
      }
    }
  }

  function onKeyUp(ev: KeyboardEvent) {
    if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") {
      wsStore.sendClient({ type: "input", turn: 0 });
    }
  }

  /* ============================================================================
   * Room closed -> redirect
   * ========================================================================== */
  const lastRoomClosed = $derived($wsStore.lastRoomClosed);

  $effect(() => {
    const roomId = $wsStore.roomId;
    const closed = lastRoomClosed;
    if (!roomId || !closed) return;
    if (String(closed.roomId) !== String(roomId)) return;

    toast.info(closed.reason || "The game was closed.");
    leaveAndGoDashboard();
  });

  /* ============================================================================
   * Lifecycle
   * ========================================================================== */
  onMount(() => {
    if (!canvas) return;

    const renderer = createCanvasRenderer(canvas, {
      w: 806,
      h: 806,
      getPulseEnabled: () => showStartOverlay,
      getPulsePlayerId: () => ($wsStore.playerId ? String($wsStore.playerId) : null),
    });

    stopRender = renderer.start(
      () => snapshot,
      () => $wsStore.segments,
    );

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const roomId = $wsStore.roomId;
    const playerId = $wsStore.playerId;
    if (roomId && playerId) {
      wsStore.updatePlayerScene(roomId, playerId, "game");
    }

    stopFinishWatch = finish.start();
  });

  onDestroy(() => {
    stopLocal();
    if (!didLeave) {
      didLeave = true;
      wsStore.leaveRoom?.();
    }
  });
</script>


<!-- Page -->
<div class="page">
  <div class="layout">
    <!-- Left: Game -->
    <div class="canvasWrap" class:blurred={showStartOverlay}>
      <GameCanvas bind:canvas />
      <StartOverlay
        show={showStartOverlay}
        phase={phase}
        onCountdownEnd={handleCountdownEnd}
      />
      <FinishOverlay
        show={showFinishedOverlay}
        winnerName={winnerName}
        winnerAvatar={winnerAvatar}
        countdown={$countdown}
        onGoDashboard={goDashboard}
      />
    </div>

    <!-- Right: Players -->
    <PlayersPanel
      status={$wsStore.status}
      players={players}
      youId={youId}
      metaById={metaById}
      onLeave={leaveAndGoDashboard}
    />
  </div>
</div>


<style>
  .page {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 24px;
    box-sizing: border-box;
  }

  .layout {
    display: flex;
    align-items: flex-start;
    gap: 18px;
    flex-wrap: nowrap;
  }

  .canvasWrap {
    position: relative;
    transition: filter 0.5s ease;
  }

  .canvasWrap.blurred {
    pointer-events: none;
  }

</style>
