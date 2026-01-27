<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { page } from "$app/stores";
	import { get } from "svelte/store";

	import { wsStore } from "$lib/stores/ws";
	import type { ServerMsg } from "@ft/game-ws-protocol";

	type StateMsg = Extract<ServerMsg, { type: "state" }>;

	let showStartHint = true;

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
	// canvas
	// ---------------------
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	function resizeCanvas() {
		if (!canvas || !ctx) return;

		const dpr = window.devicePixelRatio || 1;
		const w = window.innerWidth;
		const h = window.innerHeight;

		canvas.style.width = `${w}px`;
		canvas.style.height = `${h}px`;
		canvas.width = Math.floor(w * dpr);
		canvas.height = Math.floor(h * dpr);

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

		const W = window.innerWidth;
		const H = window.innerHeight;

		ctx.clearRect(0, 0, W, H);

		// background
		ctx.fillStyle = "#0b0b0b";
		ctx.fillRect(0, 0, W, H);

		if (!snapshot) return;

		// HUD
		ctx.fillStyle = "white";
		ctx.font = "14px system-ui";
		ctx.fillText(`tick: ${snapshot.tick}`, 12, 20);
		ctx.fillText(`room: ${snapshot.roomId}`, 12, 40);

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
			ctx.fillStyle = p.alive
				? rgbaToColor(p.color)
				: "rgba(10,10,10,0.5)";

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
		raf = requestAnimationFrame(loop);
	}

	// ---------------------
	// input
	// ---------------------
	function onKeyDown(ev: KeyboardEvent) {
		if (ev.code === "Space") {
			ev.preventDefault();

			// TODO: Validation before game start
			if (showStartHint) {
				showStartHint = false;
				wsStore.startGame?.();
			}
			return;
		}

		if (ev.key === "ArrowLeft")
			wsStore.sendClient({ type: "input", turn: -1 });

		if (ev.key === "ArrowRight")
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
		const p = get(page);

		const roomId = p.params.roomId;
		const playerId = p.url.searchParams.get("playerId") ?? "p1";

		ctx = canvas.getContext("2d")!;

		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);

		wsStore.joinRoom(roomId, playerId);

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

<canvas
	bind:this={canvas}
	style="display:block; width:100vw; height:100vh;"
></canvas>

<div
	style="
		position:fixed;
		left:12px;
		bottom:12px;
		background:rgba(0,0,0,0.5);
		color:white;
		padding:8px 10px;
		border-radius:8px;
		font:12px system-ui;
	"
>
	{$wsStore.status}
</div>

{#if showStartHint}
  <div
    style="
      position:fixed;
      inset:0;
      display:flex;
      align-items:center;
      justify-content:center;
      pointer-events:none;
    "
  >
    <div
      style="
        background:rgba(0,0,0,0.55);
        color:white;
        padding:14px 18px;
        border-radius:12px;
        font:14px system-ui;
        letter-spacing:0.2px;
      "
    >
      Press <b>Space</b> to start
    </div>
  </div>
{/if}
