<script lang="ts">
  type Props = {
    show: boolean;
    label: string;
    sub?: string;
    canReconnect?: boolean;
    onReconnect?: () => void;
    onLeave?: () => void;
  };

  let {
    show,
    label,
    sub = "Hold on — we’ll put you back in the match.",
    canReconnect = true,
    onReconnect,
    onLeave,
  }: Props = $props();
</script>

{#if show}
  <div class="reconnectOverlay" aria-live="polite">
    <div class="reconnectCard">
      <div class="spinner"></div>
      <div class="title">{label}</div>
      <div class="sub">{sub}</div>

      <div class="actions">
        {#if onReconnect}
          <button
            class="btn"
            type="button"
            onclick={onReconnect}
            disabled={!canReconnect}
          >
            Try reconnecting
          </button>
        {/if}

        {#if onLeave}
          <button class="btn ghost" type="button" onclick={onLeave}>
            Leave
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .reconnectOverlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(10px);
    z-index: 50;
  }

  .reconnectCard {
    pointer-events: auto;
    width: min(420px, 92vw);
    background: rgba(0, 0, 0, 0.65);
    border: 4px solid rgba(255, 255, 255, 0.10);
    border-radius: 18px;
    padding: 18px 18px 14px;
    text-align: center;
  }

  .title {
    margin-top: 10px;
    font-weight: 700;
    font-size: 16px;
  }

  .sub {
    margin-top: 6px;
    font-size: 13px;
    opacity: 0.75;
  }

  .btn {
    margin-top: 14px;
    width: 100%;
    border-radius: 12px;
    padding: 10px 12px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.08);
    color: white;
    cursor: pointer;
  }

  .actions {
    display: flex;
    gap: 10px;
    margin-top: 14px;
    justify-content: center;
  }

  .btn:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  .spinner {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    border: 2px solid rgba(255, 255, 255, 0.25);
    border-top-color: rgba(255, 255, 255, 0.9);
    margin: 0 auto;
    animation: spin 0.9s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>