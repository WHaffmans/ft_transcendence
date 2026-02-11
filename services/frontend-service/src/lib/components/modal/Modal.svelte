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

<svelte:window onkeydown={(e) => { if (open && e.key === 'Escape') onClose(); }} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
		<!-- Backdrop -->
		<button
			type="button"
			class="absolute inset-0 bg-black/60 backdrop-blur-sm"
			aria-label="Close modal"
			onclick={onClose}
			>
		</button>

		<!-- Modal -->
		<div class="relative z-10 w-lg max-w-[90vw] flex flex-col max-h-[60vh] shadow-xl rounded-xl bg-neutral-900">
			<!-- Fixed Header -->
			<header class="relative flex items-center justify-center px-6 pt-6 pb-4 border-b border-white/10">
				<h2 class="text-lg font-medium text-white">{title}</h2>
				<button
					type="button"
					class="absolute text-gray-400 transition-colors right-6 hover:text-white"
					onclick={onClose}
					aria-label="Close modal"
				>
					✕
				</button>
			</header>

			<!-- Scrollable Content -->
		<div class="px-6 py-4 overflow-y-auto text-sm text-gray-300 modal-scroll">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
