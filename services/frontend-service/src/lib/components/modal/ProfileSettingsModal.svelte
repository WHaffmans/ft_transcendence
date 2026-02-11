<script lang="ts">
	import { userStore } from '$lib/stores/user';
	import SubModal from './SubModal.svelte';

	// Derive current values from the store (reactive)
	let storeAvatar = $derived($userStore?.avatar_url ?? '');
	let storeNickname = $derived($userStore?.name ?? '');

	// Local overrides — null means "no local edit, use store value"
	let localAvatar: string | null = $state(null);
	let localNickname: string | null = $state(null);

	// Display values: local edit wins over store
	let editedAvatar = $derived(localAvatar ?? storeAvatar);
	let editedNickname = $derived(localNickname ?? storeNickname);

	// Sub-modal state
	let activeSubModal: 'avatar' | 'nickname' | 'delete' | null = $state(null);

	// --- Change Avatar draft state ---
	let draftAvatarUrl = $state('');
	let hasAvatarChanged = $derived(draftAvatarUrl !== '' && draftAvatarUrl !== editedAvatar);
	let fileInput: HTMLInputElement | undefined = $state();

	function handleFileSelect(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file || !file.type.startsWith('image/')) return;
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === 'string') {
				draftAvatarUrl = reader.result;
			}
		};
		reader.readAsDataURL(file);
	}

	function openAvatarSubModal() {
		draftAvatarUrl = editedAvatar;
		activeSubModal = 'avatar';
	}

	function keepAvatar() {
		localAvatar = draftAvatarUrl;
		activeSubModal = null;
	}

	function undoAvatar() {
		draftAvatarUrl = editedAvatar;
	}
</script>

<div class="space-y-6">
	<!-- Profile display compartment -->
	<div class="flex flex-col items-center gap-3 p-6">
		<!-- Avatar -->
		<img
			src={editedAvatar}
			alt={editedNickname}
			class="object-cover w-1/3 rounded-full aspect-square"
		/>

		<!-- Nickname -->
		<p class="text-xl font-semibold text-white">{editedNickname}</p>
	</div>

	<!-- Action buttons -->
	<div class="flex flex-col items-center gap-3">
		<button
			type="button"
			class="flex h-14 w-4/5 items-center justify-center rounded-lg bg-white text-sm font-bold text-black shadow-lg transition hover:-translate-y-0.5"
			onclick={openAvatarSubModal}
		>
			CHANGE AVATAR
		</button>
		<button
			type="button"
			class="flex h-14 w-4/5 items-center justify-center rounded-lg bg-white text-sm font-bold text-black shadow-lg transition hover:-translate-y-0.5"
			onclick={() => (activeSubModal = 'nickname')}
		>
			CHANGE NICKNAME
		</button>
		<button
			type="button"
			class="flex h-14 w-4/5 items-center justify-center rounded-lg bg-[#f36] text-sm font-bold text-black shadow-[0px_4px_15px_0px_rgba(255,51,102,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0px_6px_20px_0px_rgba(255,51,102,0.35)]"
			onclick={() => (activeSubModal = 'delete')}
		>
			DELETE ACCOUNT
		</button>
	</div>
</div>

<!-- Change Avatar Sub-Modal -->
{#if activeSubModal === 'avatar'}
	<SubModal title="Change Avatar" onBack={() => (activeSubModal = null)}>
		<div class="flex flex-col items-center gap-5">
			<!-- Live avatar preview -->
			<img
				src={draftAvatarUrl}
				alt="Avatar preview"
				class="object-cover w-3/5 rounded-full aspect-square"
			/>

			<!-- URL input -->
			<input
				type="text"
				placeholder="Paste new avatar URL…"
				bind:value={draftAvatarUrl}
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
					disabled={!hasAvatarChanged}
					onclick={keepAvatar}
				>
					KEEP
				</button>
				<button
					type="button"
					class="flex h-11 w-2/5 items-center justify-center rounded-lg bg-white text-xs font-bold text-black shadow-lg transition hover:-translate-y-0.5 disabled:opacity-30 disabled:pointer-events-none"
					disabled={!hasAvatarChanged}
					onclick={undoAvatar}
				>
					UNDO
				</button>
			</div>
		{/snippet}
	</SubModal>
{/if}
