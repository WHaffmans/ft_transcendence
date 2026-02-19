<script lang="ts">
  type ColorRGBA = { r: number; g: number; b: number; a: number };

  interface Props {
    show: boolean;
    phase: "lobby" | "ready" | "running" | "finished" | null;
    players?: Array<{ id: string; color: ColorRGBA }>;
    youId?: string | null;
    metaById?: Record<string, { name?: string; avatar_url?: string }>;
    onCountdownEnd?: () => void;
  }

  let {
    show,
    phase = null,
    players = [],
    youId = null,
    metaById = {},
    onCountdownEnd,
  }: Props = $props();

  let countdown = $state(3);
  let showGo = $state(false);

  function rgbaToCss(c: ColorRGBA) {
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a / 255})`;
  }

  function displayName(playerId: string) {
    return metaById[String(playerId)]?.name ?? `Player ${playerId}`;
  }

  function isYou(playerId: string) {
    return !!youId && String(playerId) === String(youId);
  }

  $effect(() => {
    if (phase !== "ready" || !show) return;

    countdown = 3;
    showGo = false;

    const t = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        clearInterval(t);
        showGo = true;
        onCountdownEnd?.();
        setTimeout(() => { showGo = false; }, 600);
      }
    }, 1000);

    return () => {
      clearInterval(t);
    };
  });
</script>

{#if show}
  <div class="overlay">
    <div class="overlayCard">
      {#if phase === "lobby"}
        <p class="waitingText">Waiting for all players…</p>

      {:else if phase === "ready"}
        <!-- Player colors -->
        <p class="sectionLabel">PLAYERS</p>

        <div class="playerList">
          {#each players as p (p.id)}
            <div class="playerChip">
              <span
                class="colorDot"
                style="background: {rgbaToCss(p.color)}; box-shadow: 0 0 8px {rgbaToCss(p.color)}"
              ></span>
              <span class="chipName">{displayName(p.id)}</span>
              {#if isYou(p.id)}
                <span class="youTag">YOU</span>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Countdown -->
        <div class="countdownWrap">
          {#if showGo}
            {#key "go"}
              <div class="countdownNumber go">GO!</div>
            {/key}
          {:else if countdown > 0}
            {#key countdown}
              <div class="countdownNumber">{countdown}</div>
            {/key}
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    z-index: 1000;
  }

  .overlayCard {
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 32px 40px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    font: 14px system-ui;
    letter-spacing: 0.2px;
    min-width: 320px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .waitingText {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0.3px;
  }

  .sectionLabel {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
  }

  .playerList {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .playerChip {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
  }

  .colorDot {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    flex: 0 0 auto;
  }

  .chipName {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  }

  .youTag {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.3px;
    padding: 2px 8px;
    border-radius: 999px;
    background: #3b82f6;
    color: white;
  }

  .countdownWrap {
    margin-top: 8px;
    min-height: 110px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .countdownNumber {
    font-size: 96px;
    font-weight: 900;
    color: white;
    line-height: 1;
    text-align: center;
    animation: popIn 0.3s ease-out;
  }

  .countdownNumber.go {
    font-size: 72px;
    color: #0f8;
  }

  @keyframes popIn {
    from {
      transform: scale(1.6);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
