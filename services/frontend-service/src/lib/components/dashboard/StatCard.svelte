<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		children: Snippet;
		class?: string;
	}

	let { title, children, class: className = '' }: Props = $props();
</script>

<div class="glass h-card rounded-2xl flex-1 min-w-0 {className}">
	<div class="p-6 flex flex-col h-full">
		<p class="text-xs font-bold text-[#888] uppercase mb-4">
			{title}
		</p>
		<div class="flex-1 flex items-start">
			{@render children()}
		</div>
	</div>
</div>
