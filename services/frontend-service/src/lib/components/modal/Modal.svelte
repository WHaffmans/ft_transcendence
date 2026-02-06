<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		children: Snippet;
		onClose: () => void;
	}

	let { open, title, children, onClose }: Props = $props();
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<!-- Backdrop -->
		<button
			type="button"
			class="absolute inset-0 bg-black/60 backdrop-blur-sm"
			aria-label="Close modal"
			onclick={onClose}
			>
		</button>

		<!-- Modal -->
		<div class="relative z-10 w-lg max-w-[90vw] p-6 shadow-xl rounded-xl bg-neutral-900">
			<header class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-medium text-white">{title}</h2>
				<button
					type="button"
					class="text-gray-400 hover:text-white"
					onclick={onClose}
					aria-label="Close modal"
				>
					✕
				</button>
			</header>

			<div class="text-sm text-gray-300">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
