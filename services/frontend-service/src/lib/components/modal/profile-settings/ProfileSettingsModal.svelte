<script lang="ts">
	import { userStore } from '$lib/stores/user';
	import ChangeAvatarModal from './ChangeAvatarModal.svelte';
	import ChangeNicknameModal from './ChangeNicknameModal.svelte';
	import DeleteAccountModal from './DeleteAccountModal.svelte';

	// Reactive store values
	let avatar = $derived($userStore?.avatar_url ?? '');
	let nickname = $derived($userStore?.name ?? '');

	// Sub-modal routing
	let activeSubModal: 'avatar' | 'nickname' | 'delete' | null = $state(null);
</script>

<div class="space-y-6">
	<!-- Profile display -->
	<div class="flex flex-col items-center gap-3 p-6">
		<img
			src={avatar}
			alt={nickname}
			class="object-cover w-1/3 rounded-full aspect-square"
		/>
		<p class="text-xl font-semibold text-white">{nickname}</p>
	</div>

	<!-- Action buttons -->
	<div class="flex flex-col items-center gap-3">
		<button
			type="button"
			class="flex h-14 w-4/5 items-center justify-center rounded-lg bg-white text-sm font-bold text-black shadow-lg transition hover:-translate-y-0.5"
			onclick={() => (activeSubModal = 'avatar')}
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

{#if activeSubModal === 'avatar'}
	<ChangeAvatarModal currentAvatar={avatar} onBack={() => (activeSubModal = null)} />
{:else if activeSubModal === 'nickname'}
	<ChangeNicknameModal currentNickname={nickname} onBack={() => (activeSubModal = null)} />
{:else if activeSubModal === 'delete'}
	<DeleteAccountModal currentNickname={nickname} onBack={() => (activeSubModal = null)} />
{/if}
