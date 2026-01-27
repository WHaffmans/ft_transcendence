<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div
	class="glass w-full lg:w-210 h-ranking rounded-2xl p-6 grid grid-cols-2 gap-4 relative"
	style="background-image: url('/assets/lobby-grid-pattern.png'), linear-gradient(90deg, rgba(26, 26, 26, 0.6) 0%, rgba(26, 26, 26, 0.6) 100%); background-size: 40px 40px, auto; background-position: top left;"
>
	{@render children()}
</div>
