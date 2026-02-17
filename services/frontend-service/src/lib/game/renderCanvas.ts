/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   renderCanvas.ts                                    :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/02/16 12:41:28 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/02/17 08:58:15 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

type ColorRGBA = { r: number; g: number; b: number; a: number };

type Segment = {
  x1: number; y1: number;
  x2: number; y2: number;
  isGap?: boolean;
  color: ColorRGBA;
};

type Player = {
  id: string;
  x: number; y: number;
  angle: number;
  alive: boolean;
  color: ColorRGBA;
};

type Snapshot = {
  segments?: Segment[];
  players?: Player[];
};

type Options = {
  w: number;
  h: number;
  deadFill?: string;
};

export function createCanvasRenderer(
  canvas: HTMLCanvasElement,
  opts: Options
) {
  const { w, h, deadFill = "rgba(10,10,10,0.5)" } = opts;

  const ctx0 = canvas.getContext("2d");
  if (!ctx0) throw new Error("Could not get 2D canvas context");
  const ctx = ctx0;

  function rgbaToColor(c: ColorRGBA): string {
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a / 255})`;
  }

  function rgbaToCss(c: ColorRGBA, alphaMul = 1) {
    const a = Math.max(0, Math.min(1, (c.a / 255) * alphaMul));
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);

    // draw in CSS pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(players: Player[] | null, segments: Segment[] | null) {
    ctx.clearRect(0, 0, w, h);
    if (!players || ! segments) return;

    // segments
    for (const s of segments ?? []) {
      if (s.isGap) continue;

      const { x1, y1, x2, y2 } = s;
      if ([x1, y1, x2, y2].some((v) => typeof v !== "number")) continue;

      ctx.strokeStyle = rgbaToColor(s.color);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // players
    const r = 4;
    const ring = 3;
    const ringAlpha = 0.18;

    for (const p of players ?? []) {
      const base = rgbaToColor(p.color);

      // Outer ring
      if (p.alive) {
        ctx.fillStyle = rgbaToCss(p.color, ringAlpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + ring, 0, Math.PI * 2);
        ctx.fill();
      }

      // Inner dot
      ctx.fillStyle = p.alive ? base : deadFill;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Dead X
      if (!p.alive) {
        ctx.strokeStyle = base;
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

  function start(
    getSnapshot: () => Snapshot | null | undefined,
    getSegments: () => Segment[] | null | undefined,
  ) {
    resize();

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const loop = () => {
      const snap = getSnapshot();
      const players = snap?.players ?? null;
      const segments = getSegments() ?? null;

      draw(players, segments);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // cleanup
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }

  return { start, resize, draw };
}
