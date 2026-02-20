<script lang="ts">
  interface Props {
    show: boolean;
    phase: "lobby" | "ready" | "running" | "finished" | null;
    onCountdownEnd?: () => void;
  }

  let {
    show,
    phase = null,
    onCountdownEnd,
  }: Props = $props();

  let countdown = $state(3);
  let showGo = $state(false);

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
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.45);
    z-index: 1000;
    border-radius: inherit;
  }

  .overlayCard {
    color: white;
    padding: 32px 40px;
    font: 14px system-ui;
    letter-spacing: 0.2px;
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

  .countdownWrap {
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
