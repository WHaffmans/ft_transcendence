<script lang="ts">
  import { Toaster } from 'svelte-sonner';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
  <title>ACHTUNG!</title>
</svelte:head>

<Toaster />

<!-- Global app background -->
<div class="relative min-h-screen overflow-hidden bg-neutral-950 container-type-inline-size">
  <!-- Background ellipse decoration -->
  <div class="absolute inset-0 pointer-events-none">
    <!-- Top right green ellipse-->
    <img  src="/assets/ellipse-top-right.svg"
          alt=""
          class="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-[80cqw]" />
    <!-- Top right green ellipse-->
    <img  src="/assets/ellipse-bottom-left.svg"
          alt=""
          class="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-[80cqw]" />
  </div>

  <!-- App shell -->
  <div class="relative z-10 flex flex-col min-h-screen">
    <main class="flex-1">
			{@render children()}
		</main>
  </div>
</div>
