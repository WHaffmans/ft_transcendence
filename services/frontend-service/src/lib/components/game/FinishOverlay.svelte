<script lang="ts">
  interface Props {
    show: boolean;
    winnerName?: string;
    winnerAvatar?: string | null;
    countdown?: number;
    onGoDashboard: () => void;
  }

  let {
    show,
    winnerName = "No winner",
    winnerAvatar = null,
    countdown = 0,
    onGoDashboard,
  }: Props = $props();

  function normalizeAvatarUrl(url: string | null) {
    if (!url) return null;
    if (/^(https?:|data:|blob:)/.test(url)) return url;
    return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  const normalizedAvatar = $derived(normalizeAvatarUrl(winnerAvatar));

  function onKeyDown(ev: KeyboardEvent) {
    if (!show) return;
    if (ev.key === "Enter") {
      ev.preventDefault();
      onGoDashboard();
    }
  }

  $effect(() => {
    if (show) window.addEventListener("keydown", onKeyDown);
    else window.removeEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
</script>

{#if show}
  <div class="overlay overlay--finished">
    <div class="overlayCard overlayCard--finished">
      <div class="avatarWrap" aria-hidden="true">
        {#if normalizedAvatar}
          <img class="avatar" src={normalizedAvatar} alt="" />
        {:else}
          <div class="avatar avatar--fallback"></div>
        {/if}
      </div>

      <div class="finishTitle">Winner!</div>

      <div class="finishWinner">
        <span class="winnerName">{winnerName}</span>
      </div>

      <div class="finishHint">
        Redirecting to dashboard in <span class="countdown">{countdown}</span>s
      </div>

      <button class="finishBtn" type="button" onclick={onGoDashboard}>
        Go to dashboard
      </button>
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
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(2px);
    z-index: 1000;
    border-radius: inherit;
  }

  .overlayCard {
    background: rgba(0, 0, 0, 0.65);
    border: 4px solid rgba(255, 255, 255, 0.10);
    border-radius: 18px;
    color: white;
    padding: 14px 18px;
    font: 14px system-ui;
    letter-spacing: 0.2px;
    z-index: 2;
  }

  .overlayCard--finished {
    width: 420px;
    max-width: 92vw;
    padding: 28px 32px;

    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
  }

  .winnerName {
    font-size: 32px;
    font-weight: 900;
    letter-spacing: 0.5px;
  }

  .avatarWrap {
    width: 74px;
    height: 74px;
    border-radius: 999px;
    display: grid;
    place-items: center;

    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
    overflow: hidden;
    margin-bottom: 2px;
  }

  .avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 999px;
  }

  .avatar--fallback {
    width: 100%;
    height: 100%;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.25);
  }

  .finishBtn {
    margin-top: 6px;
    padding: 12px 16px;
    border-radius: 12px;

    background: rgba(0, 255, 136, 0.18);
    border: 1px solid rgba(0, 255, 136, 0.35);
    color: rgba(255, 255, 255, 0.95);

    font: 12px system-ui;
    font-weight: 700;
    letter-spacing: 0.2px;

    cursor: pointer;
  }

  .finishBtn:hover {
    background: rgba(0, 255, 136, 0.24);
  }

  .countdown {
    font-weight: 800;
  }

  .winnerName {
    font-weight: 800;
  }
</style>
