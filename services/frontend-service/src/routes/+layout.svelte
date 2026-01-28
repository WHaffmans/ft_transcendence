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
<div class="relative min-h-screen overflow-hidden bg-[url('/assets/trans_background.webp')] bg-cover bg-center bg-no-repeat container-type-inline-size">

    <!-- App shell -->
  <div class="relative z-10 flex flex-col min-h-screen">
    <main class="flex-1">
			{@render children()}
		</main>
  </div>
</div>
