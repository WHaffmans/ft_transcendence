<script lang="ts">
  import PlayerRow from "$lib/components/game/PlayerRow.svelte";

  type ColorRGBA = { r: number; g: number; b: number; a: number };

  interface Props {
    status: "open" | "closed" | "error" | (string & {});
    players?: Array<{
      id: string;
      alive: boolean;
      x: number;
      y: number;
      angle: number;
      color: ColorRGBA;
    }>;
    youId?: string | null;
    metaById?: Record<string, { name?: string; avatar_url?: string }>;
    onLeave?: (() => void | Promise<void>) | null;
  }

  let {
    status,
    players = [],
    youId = null,
    metaById = {},
    onLeave = null,
  }: Props = $props();

  function displayName(playerId: string) {
    return metaById[String(playerId)]?.name ?? `Player ${playerId}`;
  }

  function rgbaToCss(c: ColorRGBA, alphaMul = 1) {
    const a = Math.max(0, Math.min(1, (c.a / 255) * alphaMul));
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
  }

  function isYou(playerId: string) {
    return !!youId && String(playerId) === String(youId);
  }
</script>

<aside class="right">
  <div class="glass h-ranking rounded-2xl w-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 pt-6">
      <p class="text-xs font-bold text-[#888] uppercase">Server</p>

      <span class="wsPill" data-status={status}>
        {status}
      </span>
    </div>

    <div class="px-6">
      <div class="h-px w-full bg-white/10 mt-2.5"></div>
    </div>

    <!-- Content -->
    <div class="flex-1 flex flex-col px-6 py-6">
      {#if players.length === 0}
        <div class="text-xs text-white/40">No players yet...</div>
      {:else}
        <div class="playerList">
          {#each players as p (p.id)}
            <PlayerRow
              name={displayName(p.id)}
              alive={p.alive}
              isYou={isYou(p.id)}
              colorCss={rgbaToCss(p.color)}
              ringCss={rgbaToCss(p.color, 0.18)}
            />
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Leave button -->
  <div class="leaveFooter">
    <button
      type="button"
      class="leaveBtn"
      aria-label="Leave game"
      title="Leave game"
      onclick={() => onLeave?.()}
    >
      <img class="leaveIcon" src="/assets/exit_icon.png" alt="" />
    </button>
  </div>
</aside>

<style>
  .right {
    width: 360px;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-sizing: border-box;
  }

  .right > .glass {
    flex: 1;
    height: auto;
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

  .playerList {
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow: auto;
    padding-right: 4px;
  }

  .leaveBtn {
    width: 44px;
    height: 44px;
    padding: 8px;
    box-sizing: border-box;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    background: rgba(255, 80, 80, 0.14);
    border: 2px solid rgba(255, 80, 80, 0.35);
    opacity: 0.9;
  }

  .leaveFooter {
    display: flex;
    justify-content: flex-end;
  }
</style>
