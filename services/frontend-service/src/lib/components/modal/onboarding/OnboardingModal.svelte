<script lang="ts">
  import { modalStore } from '$lib/components/modal/modal';

  function dismiss() {
    modalStore.close();
  }
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Enter') dismiss(); }} />

<div class="flex flex-col items-center gap-6 px-4 py-2 text-center">
  <!-- Player identity -->
  <p class="max-w-xs text-sm leading-relaxed text-white/90">
    <span class="font-bold text-white">You're the blinking dot.</span> Your trail grows as you move — avoid all trails and look out for the walls!
  </p>

  <!-- Controls -->
  <div class="flex flex-col items-center gap-3">
    <div class="flex items-center gap-4">
      <kbd class="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-white/15 bg-white/6 text-xl font-bold text-white">←</kbd>
      <span class="text-xs font-medium tracking-wide text-white/60">STEER</span>
      <kbd class="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-white/15 bg-white/6 text-xl font-bold text-white">→</kbd>
    </div>
    <p class="max-w-xs text-sm text-white/70">
      Use the <span class="font-semibold text-white/90">left</span> and <span class="font-semibold text-white/90">right</span> arrow keys to steer your curve. Last player alive wins the round.
    </p>
  </div>

  <!-- CTA -->
  <button
    onclick={dismiss}
    class="btn-primary mt-2 h-12 w-48 text-sm font-bold tracking-wide"
  >
    GOT IT!
  </button>
</div>
