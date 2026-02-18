<script lang="ts">
  export let name: string;
  export let alive: boolean;
  export let isYou: boolean;

  export let colorCss: string;
  export let ringCss: string;
</script>

<div class="playerRow" data-alive={alive}>
    <span
      class="dot"
      style="background:{colorCss}; box-shadow: 0 0 0 3px {ringCss}"
      aria-hidden="true"
    ></span>

  <span class="playerName">{name}</span>

  <div class="tags">
    {#if isYou}
      <span class="tag you">YOU</span>
    {/if}
    {#if !alive}
      <span class="tag dead">OUT</span>
    {/if}
  </div>
</div>

<style>
  .playerRow {
    height: 84px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(0, 0, 0, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
  }

  .playerRow[data-alive="false"] {
    opacity: 0.65;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    flex: 0 0 auto;
  }

  .playerName {
    flex: 1;
    min-width: 0;
    font: 12px system-ui;
    font-weight: 650;
    color: rgba(255, 255, 255, 0.9);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tags {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
  }

  .tag.you {
    background: #3b82f6;
    border-color: rgba(59, 130, 246, 0.6);
    color: #fff;
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
</style>
