
<script lang="ts">
  export let name: string;
  export let alive: boolean;
  export let isYou: boolean;

  export let x: number;
  export let y: number;
  export let angleRad: number;

  export let colorCss: string;
  export let ringCss: string;

  $: angleDeg = Math.round((angleRad * 180) / Math.PI);

</script>

<div class="playerRow" data-alive={alive}>
    <span
        class="dot"
        style="background:{colorCss}; box-shadow: 0 0 0 3px {ringCss}"
        aria-hidden="true"
    ></span>

  <div class="playerMain">
    <div class="playerTop">
      <span class="playerId">{name}</span>

      {#if isYou}
        <span class="tag">YOU</span>
      {/if}

      {#if !alive}
        <span class="tag dead">OUT</span>
      {/if}
    </div>

    <div class="playerSub">
      <span>x: {Math.round(x)}, y: {Math.round(y)}</span>
      <span class="sep">•</span>
      <span>angle: {angleDeg}°</span>
    </div>
  </div>
</div>

<style>
  .playerRow {
    display: flex;
    gap: 10px;
    align-items: flex-start;

    padding: 10px 10px;
    border-radius: 12px;

    background: rgba(0, 0, 0, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .playerRow[data-alive="false"] {
    opacity: 0.65;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    margin-top: 3px;
    flex: 0 0 auto;
  }

  .playerMain {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    flex: 1;
  }

  .playerTop {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .playerId {
    font: 12px system-ui;
    font-weight: 650;
    color: rgba(255, 255, 255, 0.9);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tag {
    font: 10px system-ui;
    font-weight: 700;
    letter-spacing: 0.2px;

    padding: 2px 6px;
    border-radius: 999px;

    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.8);
  }

  .tag.dead {
    background: rgba(255, 80, 80, 0.12);
    border-color: rgba(255, 80, 80, 0.25);
    color: rgba(255, 180, 180, 0.95);
  }

  .playerSub {
    font: 11px system-ui;
    color: rgba(255, 255, 255, 0.55);
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .sep {
    opacity: 0.45;
  }
</style>
