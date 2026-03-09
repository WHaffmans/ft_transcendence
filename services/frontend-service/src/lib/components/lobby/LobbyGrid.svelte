<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div
  class="glass
         w-full lg:w-210
         rounded-2xl p-6
         grid gap-6 relative

         grid-cols-1
         items-start
         content-start

         sm:grid-cols-2

         lg:h-ranking
         lg:grid-cols-2
         lg:grid-rows-2
         lg:items-stretch
         lg:content-stretch"
  style="background-image: url('/assets/lobby-grid-pattern.png'), linear-gradient(90deg, rgba(26, 26, 26, 0.6) 0%, rgba(26, 26, 26, 0.6) 100%); background-size: 37px 37px, auto; background-position: center;"
>
  {@render children()}
</div>
