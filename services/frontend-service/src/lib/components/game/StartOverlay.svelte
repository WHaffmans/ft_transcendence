<script lang="ts">
  export let show: boolean;
  export let phase: "lobby" | "ready" | "running" | "finished" | null = null;

  export let lobbyText = "Waiting for all players to join...";
  export let readyText = "Ready, to start press ";

  $: text =
    phase === "lobby"
      ? lobbyText
      : phase === "ready"
        ? readyText
        : null;

  $: isReady = phase === "ready";
</script>

{#if show && text}
  <div class="overlay">
    <div class="overlayCard">
      {#if isReady}
        {text} <span class="keycap">SPACE</span>
      {:else}
        {text}
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
</style>
