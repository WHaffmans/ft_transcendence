<script lang="ts">
  import { onMount, onDestroy, untrack } from "svelte";
  import { goto } from "$app/navigation";
  import { toast } from "svelte-sonner";
  import { page } from "$app/stores";

  import PlayersPanel from "$lib/components/game/PlayersPanel.svelte";
  import GameCanvas from "$lib/components/game/GameCanvas.svelte";
  import FinishOverlay from "$lib/components/game/FinishOverlay.svelte";
  import StartOverlay from "$lib/components/game/StartOverlay.svelte";
  import ReconnectOverlay from "$lib/components/game/ReconnectOverlay.svelte";

  import { wsStore } from "$lib/stores/ws";
  import { userStore } from "$lib/stores/user";

  import { createCanvasRenderer } from "$lib/game/renderCanvas";
  import { createGameMetaLoader } from "$lib/game/gameMeta";
  import { createFinishRedirect } from "$lib/game/finishRedirect";


  /* ====================================================================== */
  /*                                 STATE                                  */
  /* ====================================================================== */

  let canvas = $state<HTMLCanvasElement | null>(null);

  let stopRender: null | (() => void) = null;
  let stopFinishWatch: null | (() => void) = null;

  let isOnline = $state(true);
  let didLeave = $state(false);


  /* ====================================================================== */
  /*                               DERIVED UI                               */
  /* ====================================================================== */

  const snapshot = $derived($wsStore.latestState);
  const phase = $derived(snapshot?.phase ?? null);
  const hasAnySegments = $derived(($wsStore.segments?.length ?? 0) > 0);

  const showFinishedOverlay = $derived(phase === "finished");
  const showStartOverlay = $derived((phase === "lobby" || phase === "ready") && !hasAnySegments);

  const youId = $derived($wsStore.playerId ? String($wsStore.playerId) : null);
  const players = $derived(snapshot?.players ?? []);
  const metaById = $derived($wsStore.playerMetaById ?? {});

  const isHost = $derived.by(() => {
    const s = snapshot;
    const y = youId;
    return !!s?.hostId && !!y && String(s.hostId) === String(y);
  });

  const winnerId = $derived($wsStore.winnerId ?? null);
  const winnerName = $derived.by(() => (winnerId ? displayName(String(winnerId)) : "No winner"));
  const winnerAvatar = $derived.by(() => (winnerId ? avatarUrl(String(winnerId)) : null));

  const isWsOpen = $derived($wsStore.status === "open");
  const effectiveRoomId = $derived(($page.params.roomId ?? null) ?? ($wsStore.roomId ? String($wsStore.roomId) : null));

  const showReconnectOverlay = $derived.by(() => {
    if (showFinishedOverlay) return false;
    if (!effectiveRoomId) return false;
    if (!$userStore?.id) return false;
    if (!isOnline) return true;
    return !isWsOpen;
  });

  const reconnectLabel = $derived.by(() => {
    if (!isOnline) return "No internet connection...";

    switch ($wsStore.status) {
      case "connecting":
        return "Reconnecting...";
      case "disconnected":
        return "Connection lost - reconnecting...";
      case "error":
        return "Connection error - retrying...";
      default:
        return "";
    }
  });

  const canManualReconnect = $derived.by(() => {
    if (!isOnline) return false;
    if (showFinishedOverlay) return false;
    return $wsStore.status !== "connecting";
  });

  $effect(() => {
    if (!showFinishedOverlay) return;

    untrack(() => {
      console.log("winner", {
        winnerId,
        winnerName,
        winnerAvatar,
        meta: metaById[String(winnerId ?? "")],
      });
    });
  });


  /* ====================================================================== */
  /*                                HELPERS                                 */
  /* ====================================================================== */

  function displayName(playerId: string) {
    return metaById[String(playerId)]?.name ?? `Player ${playerId}`;
  }

  function avatarUrl(playerId: string) {
    return metaById[String(playerId)]?.avatar_url ?? null;
  }

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


  /* ====================================================================== */
  /*                               META LOADER                              */
  /* ====================================================================== */

  const metaLoader = createGameMetaLoader(wsStore, {
    defaultAvatar: "/placeholders/avatars/avatar_placeholder.webp",
  });

  $effect(() => {
    metaLoader.ensureLoaded($wsStore.roomId);
  });


  /* ====================================================================== */
  /*                          FINISH OVERLAY REDIRECT                        */
  /* ====================================================================== */

  const finish = createFinishRedirect({
    seconds: 10,
    isFinished: () => showFinishedOverlay,
    onDone: () => goto("/dashboard", { invalidateAll: true }),
  });

  const countdown = finish.countdown;

  function goDashboard() {
    goto("/dashboard", { invalidateAll: true });
  }


  /* ====================================================================== */
  /*                              NETWORK EVENTS                             */
  /* ====================================================================== */

  function onOnline() {
    isOnline = true;
    if (effectiveRoomId) ensureJoinedFromGameRoute(effectiveRoomId);
  }

  function onOffline() {
    isOnline = false;
    wsStore.forceDisconnect("offline");
  }

  function tryReconnectNow() {
    if (!navigator.onLine) return;
    if (!effectiveRoomId) return;
    wsStore.forceDisconnect("manual_reconnect");
    ensureJoinedFromGameRoute(effectiveRoomId);
  }


  /* ====================================================================== */
  /*                                  INPUTS                                */
  /* ====================================================================== */

  function handleCountdownEnd() {
    if (isHost && $wsStore.status === "open" && $wsStore.roomId) {
      wsStore.startGame();
    }
  }

  function onKeyDown(ev: KeyboardEvent) {
    if (showReconnectOverlay) return;

    if (ev.code === "Space") {
      ev.preventDefault();
      return;
    }

    if (phase !== "running") return;
    if ($wsStore.status !== "open") return;

    if (ev.key === "ArrowLeft") wsStore.sendClient({ type: "input", turn: -1 });
    if (ev.key === "ArrowRight") wsStore.sendClient({ type: "input", turn: 1 });
  }

  function onKeyUp(ev: KeyboardEvent) {
    if (showReconnectOverlay) return;
    if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") {
      wsStore.sendClient({ type: "input", turn: 0 });
    }
  }


  /* ====================================================================== */
  /*                                 REDIRECT                               */
  /* ====================================================================== */

  const lastRoomClosed = $derived($wsStore.lastRoomClosed);

  $effect(() => {
    const roomId = $wsStore.roomId;
    const closed = lastRoomClosed;
    if (!roomId || !closed) return;
    if (String(closed.roomId) !== String(roomId)) return;

    toast.info(closed.reason || "The game was closed.");
    leaveAndGoDashboard();
  });


  /* ====================================================================== */
  /*                           AUTO RECONNECT LOOP                           */
  /* ====================================================================== */

  let reconnectT: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempt = 0;

  function stopReconnectLoop() {
    if (reconnectT) clearTimeout(reconnectT);
    reconnectT = null;
    reconnectAttempt = 0;
  }

  function scheduleReconnect(roomId: string) {
    if (reconnectT) return;

    const delay = Math.min(5000, 400 * Math.pow(1.6, reconnectAttempt));
    reconnectAttempt += 1;

    reconnectT = setTimeout(() => {
      reconnectT = null;

      if (didLeave) return;
      if (!navigator.onLine) return;
      if (showFinishedOverlay) return;
      if (!$userStore?.id) return;

      if ($wsStore.status === "connecting" || $wsStore.status === "open") return;

      ensureJoinedFromGameRoute(roomId);

      scheduleReconnect(roomId);
    }, delay);
  }

  $effect(() => {
    if (didLeave || showFinishedOverlay) {
      stopReconnectLoop();
      return;
    }

    if (!navigator.onLine) {
      stopReconnectLoop();
      return;
    }

    const roomId = effectiveRoomId;
    const userId = $userStore?.id ? String($userStore.id) : "";
    const status = $wsStore.status;

    if (!roomId || !userId) {
      stopReconnectLoop();
      return;
    }

    if (status === "open") {
      stopReconnectLoop();
      return;
    }

    scheduleReconnect(roomId);
  });


  /* ====================================================================== */
  /*                                  REJOIN                                */
  /* ====================================================================== */

  function ensureJoinedFromGameRoute(roomId: string) {
    const user = $userStore ?? null;
    if (!user?.id) {
      goto("/dashboard", { replaceState: true });
      return;
    }

    wsStore.setPlayerMeta(String(user.id), {
      name: user.name,
      avatar_url: user.avatar_url,
    });

    const player = {
      playerId: String(user.id),
      rating_mu: Number(user.rating_mu ?? 25),
      rating_sigma: Number(user.rating_sigma ?? 8.333),
    };

    if (
      $wsStore.status === "open" &&
      $wsStore.roomId === roomId &&
      $wsStore.playerId === player.playerId
    ) {
      wsStore.updatePlayerScene(roomId, player.playerId, "game");
      return;
    }

    wsStore.createOrJoinRoom(roomId, 0, player);
    wsStore.updatePlayerScene(roomId, player.playerId, "game");
  }


  /* ====================================================================== */
  /*                                LIFECYCLE                               */
  /* ====================================================================== */

  onMount(() => {
    isOnline = navigator.onLine;
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    if (!canvas) return;

    const renderer = createCanvasRenderer(canvas, {
      w: 806,
      h: 806,
      getPulseEnabled: () => showStartOverlay,
      getPulsePlayerId: () => ($wsStore.playerId ? String($wsStore.playerId) : null),
    });

    stopRender = renderer.start(
      () => snapshot,
      () => $wsStore.segments
    );

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const roomId = $wsStore.roomId;
    const playerId = $wsStore.playerId;
    if (roomId && playerId) wsStore.updatePlayerScene(roomId, playerId, "game");

    stopFinishWatch = finish.start();
  });

  onDestroy(() => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);

    stopLocal();
    stopReconnectLoop();

    if (!didLeave) {
      didLeave = true;
      wsStore.leaveRoom?.();
    }
  });
</script>


<div class="page">
  <div class="layout">
    <div class="stage">
      <div class="gameLayer">
        <div class="playRow">
          <GameCanvas bind:canvas />

          <PlayersPanel
            status={$wsStore.status}
            players={players}
            youId={youId}
            metaById={metaById}
            onLeave={leaveAndGoDashboard}
          />
        </div>
      </div>

      <div class="overlayLayer">
        <div class="overlayBackdrop" class:show={showStartOverlay || showFinishedOverlay || showReconnectOverlay}></div>

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
        <ReconnectOverlay
          show={showReconnectOverlay}
          label={reconnectLabel}
          canReconnect={canManualReconnect}
          onReconnect={tryReconnectNow}
          onLeave={leaveAndGoDashboard}
        />
      </div>
    </div>
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
  }

  .stage {
    --overlay-blur: 1px;
    position: relative;
  }

  .overlayLayer {
    position: absolute;
    inset: 0;
    z-index: 10;
    pointer-events: none;
  }

  .overlayBackdrop {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 160ms ease;
    backdrop-filter: blur(var(--overlay-blur));
    -webkit-backdrop-filter: blur(var(--overlay-blur));
    background: rgba(0, 0, 0, 0.15);
  }

  .overlayBackdrop.show {
    opacity: 1;
  }

  .gameLayer {
    position: relative;
    z-index: 0;
  }

  .playRow {
    display: flex;
    align-items: flex-start;
    gap: 18px;
  }

  .overlayLayer :global(.reconnectOverlay),
  .overlayLayer :global(.reconnectCard),
  .overlayLayer :global(button) {
    pointer-events: auto;
  }
</style>
