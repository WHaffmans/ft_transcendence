<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		children: Snippet;
		footer?: Snippet;
		onBack: () => void;
	}

	let { title, children, footer, onBack }: Props = $props();
</script>

<!-- Overlay on top of the base modal -->
<div class="fixed inset-0 z-60 flex items-center justify-center">
	<!-- Backdrop -->
	<button
		type="button"
		class="absolute inset-0 bg-black/50 backdrop-blur-xs"
		aria-label="Go back"
		onclick={onBack}
	></button>

	<!-- Sub-modal panel -->
	<div
		class="relative z-10 flex w-sm max-w-[85vw] flex-col max-h-[55vh] rounded-xl bg-neutral-900 shadow-2xl"
	>
		<!-- Header with back button -->
		<header class="relative flex items-center justify-center px-6 pt-5 pb-4 border-b border-white/10">
			<button
				type="button"
				class="absolute left-5 text-gray-400 transition-colors hover:text-white"
				onclick={onBack}
				aria-label="Go back"
			>
				←
			</button>
			<h2 class="text-base font-medium text-white">{title}</h2>
		</header>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto px-6 py-5">
			{@render children()}
		</div>

		<!-- Optional footer (Keep / Undo / etc.) -->
		{#if footer}
			<div class="px-6 py-4">
				{@render footer()}
			</div>
		{/if}
	</div>
</div>
