<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { wsStore } from "$lib/stores/ws";
  import type { ServerMsg } from "@ft/game-ws-protocol";

  type StateMsg = Extract<ServerMsg, { type: "state" }>;

  // ---------------------
  // types
  // ---------------------
  type ColorRGBA = {
    r: number;
    g: number;
    b: number;
    a: number;
  };

  // ---------------------
  // derived UI state
  // ---------------------
  $: snapshot = $wsStore.latestState as StateMsg["snapshot"] | null;
  $: phase = snapshot?.phase ?? null;

  $: overlayText =
    phase === "lobby"
      ? "Waiting for all players to join..."
      : phase === "ready"
        ? "Ready to start! Press "
        : null;

  $: showOverlay = overlayText !== null;

  // ---------------------
  // canvas
  // ---------------------
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  const GAME_W = 808;
  const GAME_H = 808;

  function resizeCanvas() {
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = `${GAME_W}px`;
    canvas.style.height = `${GAME_H}px`;
    canvas.width = Math.floor(GAME_W * dpr);
    canvas.height = Math.floor(GAME_H * dpr);

    // draw in CSS pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rgbaToColor(c: ColorRGBA): string {
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a / 255})`;
  }

  // ---------------------
  // draw
  // ---------------------
  function draw(snapshot: StateMsg["snapshot"] | null) {
    if (!ctx) return;

    const W = GAME_W;
    const H = GAME_H;

    ctx.clearRect(0, 0, W, H);

    if (!snapshot) return;

    // HUD
    ctx.fillStyle = "white";
    ctx.font = "14px system-ui";
    ctx.fillText(`tick: ${snapshot.tick}`, 12, 20);
    ctx.fillText(`room: ${snapshot.roomId}`, 12, 40);

    // TODO: Remove
    ctx.fillText(`players: ${snapshot.players?.length ?? 0}`, 12, 60);
    ctx.fillText(
      `ids: ${(snapshot.players ?? []).map((p) => p.id).join(", ")}`,
      12,
      80,
    );

    // segments
    for (const s of snapshot.segments ?? []) {
      if (s.isGap) continue;

      const x0 = s.x1;
      const y0 = s.y1;
      const x1 = s.x2;
      const y1 = s.y2;

      if ([x0, y0, x1, y1].some((v) => typeof v !== "number")) continue;

      ctx.strokeStyle = rgbaToColor(s.color);
      ctx.lineWidth = 4;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    // players
    const r = 6;

    for (const p of snapshot.players ?? []) {
      ctx.fillStyle = p.alive ? rgbaToColor(p.color) : "rgba(10,10,10,0.5)";

      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();

      if (!p.alive) {
        ctx.strokeStyle = rgbaToColor(p.color);
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(p.x - r, p.y - r);
        ctx.lineTo(p.x + r, p.y + r);
        ctx.moveTo(p.x - r, p.y + r);
        ctx.lineTo(p.x + r, p.y - r);
        ctx.stroke();
      }
    }
  }

  let raf = 0;
  function loop() {
    draw($wsStore.latestState);
    console.log(`Latest state: ${$wsStore.latestState}`);
    raf = requestAnimationFrame(loop);
  }

  // ---------------------
  // input
  // ---------------------
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

  // ---------------------
  // lifecycle
  // ---------------------
  onMount(() => {
    ctx = canvas.getContext("2d")!;

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    wsStore.updatePlayerScene($wsStore.roomId, $wsStore.playerId, "game");
    loop();
  });

  onDestroy(() => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resizeCanvas);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);

    // Leave room when exiting the game page
    wsStore.leaveRoom?.();
  });
</script>

<div class="page">
  <div class="layout">
    <!-- Left: game -->
    <div class="glass rounded-2xl relative">
      <canvas class="gameCanvas" bind:this={canvas}></canvas>
    </div>

    <!-- Right: Players -->
    <aside class="right">
      <div class="glass h-ranking rounded-2xl w-full flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 pt-6">
          <p class="text-xs font-bold text-[#888] uppercase">Players</p>

          <span class="wsPill" data-status={$wsStore.status}>
            {$wsStore.status}
          </span>
        </div>

        <div class="px-6">
          <div class="h-px w-full bg-white/10 mt-2.5"></div>
        </div>

        <!-- Content -->
        <div class="flex-1 flex flex-col px-6 py-6">
          <!-- TODO: player list -->
          <div class="text-xs text-white/40">Player list goes here</div>
        </div>
      </div>
    </aside>
  </div>
</div>

{#if showOverlay}
  <div class="overlay">
    <div class="overlayCard">
      {#if phase === "ready"}
        {overlayText} <span class="keycap">SPACE</span>
      {:else}
        {overlayText}
      {/if}
    </div>
  </div>
{/if}

<style>
  .page {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 24px;
    box-sizing: border-box;
  }

  .overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(2px);
    z-index: 1000;
  }

  .overlayCard {
    background: rgba(0, 0, 0, 0.55);
    color: white;
    padding: 14px 18px;
    border-radius: 12px;
    font: 14px system-ui;
    letter-spacing: 0.2px;
  }

  .layout {
    display: flex;
    gap: 24px;
    height: 808px;
    align-items: stretch;
  }

  .gameCanvas {
    width: 808px;
    height: 808px;
    display: block;

    border-radius: 12px;
    outline: 2px solid rgba(255, 255, 255, 0.15);
    outline-offset: 0;

    background-image:
      url("/assets/lobby-grid-pattern.png"),
      linear-gradient(
        90deg,
        rgba(26, 26, 26, 0.6) 0%,
        rgba(26, 26, 26, 0.6) 100%
      );
    background-size: 40px 40px, auto;
    background-position: top left;
    background-repeat: repeat, no-repeat;
  }

  .right {
    width: 360px;
    height: 100%;
    display: flex;
  }

  .right > .glass {
    height: 100%;
  }

  .keycap {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 4px 40px;
    margin-left: 6px;

    background: rgba(91, 91, 91, 0.65);
    border-radius: 2px;

    font: 12px system-ui;
    font-weight: 700;
    letter-spacing: 0.3px;

    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
  }

  .wsPill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;

    font: 11px system-ui;
    letter-spacing: 0.2px;

    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: rgba(255, 255, 255, 0.75);
  }

  .wsPill::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.35);
  }

  .wsPill[data-status="open"] {
    border-color: rgba(0, 255, 136, 0.35);
    color: rgba(255, 255, 255, 0.9);
  }
  .wsPill[data-status="open"]::before {
    background: rgba(0, 255, 136, 0.8);
  }

  .wsPill[data-status="closed"],
  .wsPill[data-status="error"] {
    border-color: rgba(255, 80, 80, 0.35);
  }

  .wsPill[data-status="closed"]::before,
  .wsPill[data-status="error"]::before {
    background: rgba(255, 80, 80, 0.8);
  }

  /* <!-- TODO: Handle Small Screens --> */
  @media (max-width: 1240px) {
    .layout {
      flex-direction: column;
      align-items: center;
    }
    .right {
      width: 808px;
      height: auto;
      min-height: 200px;
    }
  }
</style>
