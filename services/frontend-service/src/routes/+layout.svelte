<script lang="ts">
	import { Toaster } from 'svelte-sonner';
	import '../app.css';
	import { userStore } from '$lib/stores/user';
	import { modalStore } from '$lib/components/modal/modal';
	import { modalContent } from '$lib/components/modal/modalContent';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { LayoutData } from './$types';
	import type { User } from '$lib/types/types';

	let {
		data,
		children
	}: { data: LayoutData & { user: User | null }; children: any } = $props();

	$effect(() => {
		userStore.set(data.user);
	});
</script>

<svelte:head>
	<title>ACHTUNG!</title>
</svelte:head>

<Toaster />

<!-- Root layout -->
<div class="relative min-h-screen container-type-inline-size">
	<!-- Background (non-interactive) -->
	<div
		class="absolute inset-0 z-0 pointer-events-none
		       bg-[url('/assets/trans_background.webp')]
		       bg-cover bg-center bg-no-repeat"
           >
	</div>

	<!-- App shell (interactive) -->
	<div class="relative z-10 flex flex-col min-h-screen">
		<main class="flex-1">
			{@render children()}
		</main>
	</div>
</div>

<!-- Global Modal System -->
{#if $modalStore.type && $modalStore.type in modalContent}
	<Modal
		open={true}
		title={modalContent[$modalStore.type].title}
		onClose={() => modalStore.close()}
	>
		<p class="space-y-3">
			{modalContent[$modalStore.type].content}
		</p>
	</Modal>
{/if}
