<script lang="ts">
	import { userStore } from '$lib/stores/user';
	import { apiStore } from '$lib/stores/api';
	import { modalStore } from '$lib/components/modal/modal';
	import { toast } from 'svelte-sonner';
	import SubModal from '../SubModal.svelte';

	interface Props {
		currentNickname: string;
		onBack: () => void;
	}

	let { currentNickname, onBack }: Props = $props();

	let saving = $state(false);
	let deleteConfirmInput = $state('');

	let canDelete = $derived(deleteConfirmInput === currentNickname);

	async function confirmDelete() {
		if (!$userStore?.id) {
			return;
		}
		saving = true;
		try {
			const userId = $userStore.id;
			await apiStore.logout();
			const res = await fetch(`/api/users/${userId}`, {
				method: 'DELETE',
				headers: { Accept: 'application/json' },
				credentials: 'include'
			});
			if (!res.ok) {
				throw new Error(`HTTP ${res.status}`);
			}
			modalStore.close();
			toast.success('Good Bye :(');
			window.location.href = '/';
		} catch {
			toast.error('Failed to delete account.');
		} finally {
			saving = false;
		}
	}
</script>

<SubModal title="Delete Account" {onBack}>
	<div class="flex flex-col items-center gap-5">
		<!-- Warning -->
		<p class="text-sm text-center text-gray-400">
			This action is <span class="font-bold text-red-400">permanent</span> and cannot be undone.
			All your data, match history, and rankings will be lost.
		</p>

		<!-- Instruction -->
		<p class="text-sm text-center text-gray-300">
			Type your <span class="font-bold text-white">current nickname</span> to confirm.
		</p>

		<!-- Confirmation input -->
		<input
			type="text"
			placeholder="Enter your nickname…"
			bind:value={deleteConfirmInput}
			class="w-full px-4 py-3 text-sm text-white placeholder-gray-500 transition border rounded-lg outline-none border-white/10 bg-white/5 focus:border-white/25"
		/>
	</div>

	{#snippet footer()}
		<div class="flex items-center justify-center">
			<button
				type="button"
				class="btn-danger h-11 w-3/5 text-xs"
				disabled={!canDelete || saving}
				onclick={confirmDelete}
			>
				{saving ? 'DELETING…' : 'DELETE ACCOUNT'}
			</button>
		</div>
	{/snippet}
</SubModal>
