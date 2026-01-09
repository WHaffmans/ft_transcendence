<script lang="ts">
	import { onMount, onDestroy } from "svelte";

	type TurnInput = -1 | 0 | 1;

	type ColorRGBA = {
		r: number;
		g: number;
		b: number;
		a: number;
	};

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	let ws: WebSocket | null = null;
	let status = "disconnected";
	let roomId = "r1";
	let playerId = "p1";

	let latestState: any = null;

	function makeWsUrl() {
		return "ws://localhost:3003/ws";
	}

	function safeSend(obj: unknown) {
		if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
	}

	function resizeCanvas() {
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
		return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
	}

	function draw() {
		if (!ctx) return;

		// Clear in CSS pixels
		const W = window.innerWidth;
		const H = window.innerHeight;
		ctx.clearRect(0, 0, W, H);

		// background
		ctx.fillStyle = "#0b0b0b";
		ctx.fillRect(0, 0, W, H);

		if (!latestState) return;

		// HUD
		ctx.fillStyle = "white";
		ctx.font = "14px system-ui";
		ctx.fillText(`tick: ${latestState.tick}`, 12, 20);
		ctx.fillText(`room: ${latestState.roomId}`, 12, 40);

		for (const s of latestState.segments ?? []) {
			const x0 = s.x1;
			const y0 = s.y1;
			const x1 = s.x2;
			const y1 = s.y2;

			if ([x0, y0, x1, y1].some((v) => typeof v !== "number")) continue;

			ctx.strokeStyle = rgbaToColor(s.color);

			ctx.beginPath();
			ctx.moveTo(x0, y0);
			ctx.lineTo(x1, y1);
			ctx.stroke();
		}

		// players
		const r = 6;

		for (const p of latestState.players ?? []) {
			ctx.fillStyle = p.alive
				? rgbaToColor(p.color)
				: "rgba(10,10,10,0.5)";
			ctx.beginPath();
			ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
			ctx.fill();

			if (!p.alive) {
				ctx.strokeStyle = rgbaToColor(p.color);
				ctx.lineWidth = 4;
				ctx.lineCap = "round";

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
		draw();
		raf = requestAnimationFrame(loop);
	}

	function connect() {
		status = "connecting";
		ws = new WebSocket(makeWsUrl());

		(window as any).gameWs = ws;
		(window as any).sendGame = (obj: unknown) => ws?.send(JSON.stringify(obj));

		ws.onopen = () => {
			status = "open";

			safeSend({
				type: "create_room",
				roomId,
				seed: 1,
				players: [{ playerId: "p1" }, { playerId: "p2" }]
			});

			safeSend({ type: "join_room", roomId, playerId });
		};

		ws.onmessage = (e) => {
			const msg = JSON.parse(e.data);

			if (msg.type === "State") {
				latestState = msg;

				(window as any).latestState = latestState;

				return;
			}

			console.log("WS msg:", msg);
		};

		ws.onerror = () => {
			status = "error";
		};

		ws.onclose = () => {
			status = "closed";
			ws = null;
		};
	}

	function onKeyDown(ev: KeyboardEvent) {
		if (ev.key === "ArrowLeft") safeSend({ type: "input", turn: -1 satisfies TurnInput });
		if (ev.key === "ArrowRight") safeSend({ type: "input", turn: 1 satisfies TurnInput });
	}

	function onKeyUp(ev: KeyboardEvent) {
		if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") {
			safeSend({ type: "input", turn: 0 satisfies TurnInput });
		}
	}

	onMount(() => {
		ctx = canvas.getContext("2d")!;
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);

		connect();
		loop();
	});

	onDestroy(() => {
		cancelAnimationFrame(raf);
		window.removeEventListener("resize", resizeCanvas);
		window.removeEventListener("keydown", onKeyDown);
		window.removeEventListener("keyup", onKeyUp);
		ws?.close();
	});
</script>

<canvas bind:this={canvas} style="display:block; width:100vw; height:100vh;"></canvas>

<div style="position:fixed; left:12px; bottom:12px; background:rgba(0,0,0,0.5); color:white; padding:8px 10px; border-radius:8px; font:12px system-ui;">
	{status}
</div>
