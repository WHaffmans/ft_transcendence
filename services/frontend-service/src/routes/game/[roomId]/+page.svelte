<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import { wsStore } from "$lib/stores/ws";

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
  let canvas: HTMLCanvasElement | null = null;
  let stopRender: null | (() => void) = null;
  let stopFinishWatch: null | (() => void) = null;


  /* ============================================================================
   * Derived UI state
   * ========================================================================== */
  $: snapshot = $wsStore.latestState;
  $: phase = snapshot?.phase ?? null;
  $: showStartOverlay = phase === "lobby" || phase === "ready";
  $: showFinishedOverlay = phase === "finished";

  // Meta loader
  const metaLoader = createGameMetaLoader(wsStore, {
    defaultAvatar: "/assets/avatars/default.png",
  });
  $: metaLoader.ensureLoaded($wsStore.roomId);

  // Finish overlay
  const finish = createFinishRedirect({
    seconds: 10,
    isFinished: () => showFinishedOverlay,
    onDone: () => goto("/dashboard"),
  });
  const countdown = finish.countdown;

  function goDashboard() {
    goto("/dashboard");
  }

  /* ============================================================================
   * Inputs
   * ========================================================================== */
  function onKeyDown(ev: KeyboardEvent) {
    if (ev.code === "Space") {
      ev.preventDefault();

      if ($wsStore.status === "open" && $wsStore.roomId && phase === "ready") {
        wsStore.startGame?.();
      }
      return;
    }

    if (phase !== "running") return;

    if (ev.key === "ArrowLeft")
      if ($wsStore.status === "open" && $wsStore.roomId)
        wsStore.sendClient({ type: "input", turn: -1 });

    if (ev.key === "ArrowRight")
      if ($wsStore.status === "open" && $wsStore.roomId)
        wsStore.sendClient({ type: "input", turn: 1 });
  }

  function onKeyUp(ev: KeyboardEvent) {
    if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") {
      wsStore.sendClient({ type: "input", turn: 0 });
    }
  }

  /* ============================================================================
   * Lifecycle
   * ========================================================================== */
  onMount(() => {
    if (!canvas) return;

    const renderer = createCanvasRenderer(canvas, { w: 806, h: 806 });
    stopRender = renderer.start(() => snapshot);

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
    stopRender?.();
    stopRender = null;

    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);

    wsStore.leaveRoom?.();
    stopFinishWatch?.();
    stopFinishWatch = null;
  });


  /* ============================================================================
   * List Players
   * ========================================================================== */
  $: youId = $wsStore.playerId ? String($wsStore.playerId) : null;
  $: players = snapshot?.players ?? [];
  $: metaById = $wsStore.playerMetaById ?? {};

  $: winnerId = $wsStore.winnerId ?? null;
  $: winnerName = winnerId ? displayName(String(winnerId)) : "No winner";
  $: winnerAvatar = winnerId ? avatarUrl(String(winnerId)) : null;

  $: if (showFinishedOverlay) {
    console.log("winner", { winnerId, winnerName, winnerAvatar, meta: metaById[String(winnerId ?? "")] });
  }

  function displayName(playerId: string) {
    return metaById[String(playerId)]?.name ?? `Player ${playerId}`;
  }

  function avatarUrl(playerId: string) {
    return metaById[String(playerId)]?.avatar_url ?? null;
  }
</script>


<!-- Page -->
<div class="page">
  <div class="layout">
    <!-- Left: Game -->
    <GameCanvas bind:canvas />

    <!-- Right: Players -->
    <PlayersPanel
      status={$wsStore.status}
      {players}
      {youId}
      {metaById}
    />
  </div>
</div>

<!-- Start overlay -->
<StartOverlay show={showStartOverlay} {phase} />

<!-- Finish overlay -->
<FinishOverlay
  show={showFinishedOverlay}
  {winnerName}
  {winnerAvatar}
  countdown={$countdown}
  onGoDashboard={goDashboard}
/>


<style>
  .page {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 24px;
    box-sizing: border-box;
  }

  @media (max-width: 1240px) {
    /* <!-- TODO: Handle Small Screens --> */
  }

</style>
