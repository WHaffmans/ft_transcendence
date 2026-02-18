<script lang="ts">
	import { userStore } from '$lib/stores/user';
	import { toast } from 'svelte-sonner';
	import SubModal from '../SubModal.svelte';

	interface Props {
		currentAvatar: string;
		onBack: () => void;
	}

	let { currentAvatar, onBack }: Props = $props();

	let saving = $state(false);

	let draftOverride: string | null = $state(null);
	let draftAvatarUrl = $derived(draftOverride ?? currentAvatar);
	let avatarLoadError = $state(false);
	let fileInput: HTMLInputElement | undefined = $state();
	let selectedFile: File | null = $state(null);


	function hasChanged() {
		return (
			(draftAvatarUrl !== '' && draftAvatarUrl !== currentAvatar && !avatarLoadError)
			|| !!selectedFile
		);
	}

	// Reset error state when URL changes
	$effect(() => {
		draftAvatarUrl;
		avatarLoadError = false;
	});

	function setDraft(value: string) {
		draftOverride = value;
	}

	function handleFileSelect(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file || !file.type.startsWith('image/')) {
			return;
		}
		selectedFile = file;
		// Show preview using a temporary object URL
		setDraft(URL.createObjectURL(file));
	}

	async function keep() {
		if (!$userStore?.id) {
			return;
		}
		saving = true;
		try {
			let res;
			// If draftAvatarUrl looks like a URL, PATCH as before
			if (draftAvatarUrl && /^https?:\/\//.test(draftAvatarUrl)) {
				res = await fetch(`/api/users/${$userStore.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ avatar_url: draftAvatarUrl })
				});
			} else if (selectedFile) {
				// File upload
				const formData = new FormData();
				formData.append('avatar', selectedFile);
				res = await fetch(`/api/users/${$userStore.id}/avatar`, {
					method: 'POST',
					credentials: 'include',
					body: formData
				});
			} else {
				// Invalid state
				throw new Error('No avatar selected');
			}
			if (!res.ok) {
				throw new Error(`HTTP ${res.status}`);
			}
			const updated = await res.json();
			userStore.update((u) => (u ? { ...u, avatar_url: updated.avatar_url } : u));
			toast.success('Avatar updated!');
			onBack();
		} catch {
			toast.error('Failed to update avatar.');
		} finally {
			saving = false;
		}
	}

	function undo() {
		draftOverride = null;
	}
</script>

<SubModal title="Change Avatar" {onBack}>
	<div class="flex flex-col items-center gap-5">
		<!-- Live avatar preview -->
		{#if draftAvatarUrl}
			<img
				src={draftAvatarUrl}
				alt="Avatar preview"
				class="object-cover w-3/5 rounded-full aspect-square"
				onerror={() => (avatarLoadError = true)}
			/>
		{:else}
			<div class="flex items-center justify-center w-3/5 border rounded-full aspect-square bg-white/5 border-white/10">
				<span class="text-3xl text-gray-500">?</span>
			</div>
		{/if}

		<!-- URL input -->
		<input
			type="text"
			placeholder="Paste new avatar URL…"
			value={draftAvatarUrl}
			oninput={(e) => setDraft(e.currentTarget.value)}
			class="w-full px-4 py-3 text-sm text-white placeholder-gray-500 transition border rounded-lg outline-none border-white/10 bg-white/5 focus:border-white/25"
		/>

		<!-- File browse -->
		<input
			type="file"
			accept="image/*"
			class="hidden"
			bind:this={fileInput}
			onchange={handleFileSelect}
		/>
		<button
			type="button"
			class="px-4 py-2 text-xs btn-primary"
			onclick={() => fileInput?.click()}
		>
			BROWSE FROM DEVICE
		</button>
	</div>

	{#snippet footer()}
		<div class="flex items-center justify-center gap-3">
			<button
				type="button"
				class="w-2/5 text-xs btn-primary h-11"
				disabled={!hasChanged() || saving}
				onclick={keep}
			>
				{saving ? 'SAVING…' : 'KEEP'}
			</button>
			<button
				type="button"
				class="w-2/5 text-xs btn-primary h-11"
				disabled={!hasChanged() || saving}
				onclick={undo}
			>
				UNDO
			</button>
		</div>
	{/snippet}
</SubModal>
