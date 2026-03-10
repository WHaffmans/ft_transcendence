
<script lang="ts">
  interface Props {
    canvas?: HTMLCanvasElement | null;
  }

  let { canvas = $bindable(null) }: Props = $props();
</script>

<div class="glass rounded-2xl relative">
  <canvas class="gameCanvas" bind:this={canvas}></canvas>
</div>

<style>
  .gameCanvas {
    width: 806px;
    height: 806px;
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
    background-size: 10px 10px, auto;
    background-position: calc(50% + 10px) calc(50% + 10px), center;
    background-repeat: repeat, no-repeat;
  }
</style>
