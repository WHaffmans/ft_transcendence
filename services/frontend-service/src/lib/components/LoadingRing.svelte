<script lang="ts">
    let { size = 20, class: className = '' } = $props();
</script>

<!-- Loading Ring with Ripple Effect -->
<div class="relative flex items-center justify-center {className}">
  <!-- Ripple circles -->
  <div
    class="absolute border-2 border-slate-300 rounded-full animate-ripple"
    style="width: {size}px; height: {size}px;"
  ></div>
  <!-- <div
    class="absolute w-[{size}px] h-[{size}px] border-2 border-blue-500 rounded-full animate-ripple-delay"
  ></div> -->
</div>

<style>
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes ripple {
    0% {
      transform: scale(0.1);
      opacity: 1;
    }
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }

  .animate-spin-slow {
    animation: spin 1.5s linear infinite;
  }

  .animate-ripple {
    animation: ripple 1.2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
  }

  .animate-ripple-delay {
    animation: ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
    animation-delay: 1s;
  }
</style>
