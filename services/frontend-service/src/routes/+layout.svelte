<script lang="ts">
	import { Toaster } from 'svelte-sonner';
	import '../app.css';
	import { userStore } from '$lib/stores/user';
	import { modalStore } from '$lib/components/modal/modal';
	import { modalConfig } from '$lib/components/modal/modalConfig';
	import Modal from '$lib/components/modal/Modal.svelte';
	import PrivacyPolicyModal from '$lib/components/modal/PrivacyPolicyModal.svelte';
	import TermsOfServiceModal from '$lib/components/modal/TermsOfServiceModal.svelte';
	import ProfileSettingsModal from '$lib/components/modal/ProfileSettingsModal.svelte';
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
{#if $modalStore.type === 'privacy'}
	<Modal
		open={true}
		title={modalConfig.privacy.title}
		onClose={() => modalStore.close()}
	>
		<PrivacyPolicyModal />
	</Modal>
{:else if $modalStore.type === 'terms'}
	<Modal
		open={true}
		title={modalConfig.terms.title}
		onClose={() => modalStore.close()}
	>
		<TermsOfServiceModal />
	</Modal>
{:else if $modalStore.type === 'profileSettings'}
	<Modal
		open={true}
		title={modalConfig.profileSettings.title}
		onClose={() => modalStore.close()}
	>
		<ProfileSettingsModal />
	</Modal>
{/if}
