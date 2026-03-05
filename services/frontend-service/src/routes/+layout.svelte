<script lang="ts">
	import { Toaster } from 'svelte-sonner';
	import '../app.css';
	import { userStore } from '$lib/stores/user';
	import { modalStore } from '$lib/components/modal/modal';
	import { modalConfig } from '$lib/components/modal/modalConfig';
	import Modal from '$lib/components/modal/Modal.svelte';
	import PrivacyPolicyModal from '$lib/components/modal/privacy/PrivacyPolicyModal.svelte';
	import TermsOfServiceModal from '$lib/components/modal/terms/TermsOfServiceModal.svelte';
	import ProfileSettingsModal from '$lib/components/modal/profile-settings/ProfileSettingsModal.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import type { LayoutData } from './$types';
	import type { User } from '$lib/types/types';
	import type { Snippet } from 'svelte';

	let {
		data,
		children
	}: { data: LayoutData & { user: User | null }; children: Snippet } = $props();

	$effect(() => {
		userStore.set(data.user);
	});
</script>

<svelte:head>
	<title>ACHTUNG</title>
</svelte:head>

<Toaster
  position="bottom-right"
  toastOptions={{
    unstyled: true,
    classes: {
      toast: `
        pointer-events-auto
        flex items-center gap-3
        rounded-xl
        px-4 py-3
        border border-white/10
        bg-black/35
        backdrop-blur-md
        text-white
        shadow-[0_8px_30px_rgba(0,0,0,0.35)]
      `,
      title: "text-white font-semibold leading-tight",
      description: "text-white/70 leading-snug",
      icon: "shrink-0 self-center",

      actionButton: `
        rounded-lg
        bg-white/10 hover:bg-white/15
        border border-white/10
        text-white
        px-3 py-1.5
      `,
      cancelButton: `
        rounded-lg
        bg-white/5 hover:bg-white/10
        border border-white/10
        text-white/80
        px-3 py-1.5
      `,
      closeButton: `
        rounded-md
        bg-white/5 hover:bg-white/10
        border border-white/10
        text-white/80
      `
    }
  }}
/>


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
		<main class="flex flex-col flex-1">
			{@render children()}
		</main>

		<!-- Global Footer -->
		<Footer />
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
		autoHeight={true}
	>
		<ProfileSettingsModal />
	</Modal>
{/if}
