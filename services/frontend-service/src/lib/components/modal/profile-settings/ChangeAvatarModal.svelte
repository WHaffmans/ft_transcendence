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

	let hasChanged = $derived(
		draftAvatarUrl !== '' && draftAvatarUrl !== currentAvatar && !avatarLoadError
	);

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
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === 'string') {
				setDraft(reader.result);
			}
		};
		reader.readAsDataURL(file);
	}

	async function keep() {
		if (!$userStore?.id) {
			return;
		}
		saving = true;
		try {
			const res = await fetch(`/api/users/${$userStore.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ avatar_url: draftAvatarUrl })
			});
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
		<img
			src={draftAvatarUrl}
			alt="Avatar preview"
			class="object-cover w-3/5 rounded-full aspect-square"
			onerror={() => (avatarLoadError = true)}
		/>

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
			class="rounded-lg bg-white px-4 py-2 text-xs font-bold text-black shadow-lg transition hover:-translate-y-0.5"
			onclick={() => fileInput?.click()}
		>
			BROWSE FROM DEVICE
		</button>
	</div>

	{#snippet footer()}
		<div class="flex items-center justify-center gap-3">
			<button
				type="button"
				class="flex h-11 w-2/5 items-center justify-center rounded-lg bg-white text-xs font-bold text-black shadow-lg transition hover:-translate-y-0.5 disabled:opacity-30 disabled:pointer-events-none"
				disabled={!hasChanged || saving}
				onclick={keep}
			>
				{saving ? 'SAVING…' : 'KEEP'}
			</button>
			<button
				type="button"
				class="flex h-11 w-2/5 items-center justify-center rounded-lg bg-white text-xs font-bold text-black shadow-lg transition hover:-translate-y-0.5 disabled:opacity-30 disabled:pointer-events-none"
				disabled={!hasChanged || saving}
				onclick={undo}
			>
				UNDO
			</button>
		</div>
	{/snippet}
</SubModal>
