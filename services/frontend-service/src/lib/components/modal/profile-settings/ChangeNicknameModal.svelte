<script lang="ts">
	import { userStore } from '$lib/stores/user';
	import { toast } from 'svelte-sonner';
	import SubModal from '../SubModal.svelte';

	interface Props {
		currentNickname: string;
		onBack: () => void;
	}

	let { currentNickname, onBack }: Props = $props();

	let saving = $state(false);
	let draftOverride: string | null = $state(null);
	let draftNickname = $derived(draftOverride ?? currentNickname);

	let hasChanged = $derived(
		draftNickname.trim() !== '' && draftNickname.trim() !== currentNickname
	);

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
				body: JSON.stringify({ name: draftNickname.trim() })
			});
			if (!res.ok) {
				throw new Error(`HTTP ${res.status}`);
			}
			const updated = await res.json();
			userStore.update((u) => (u ? { ...u, name: updated.name } : u));
			toast.success('Nickname updated!');
			onBack();
		} catch {
			toast.error('Failed to update nickname.');
		} finally {
			saving = false;
		}
	}

	function undo() {
		draftOverride = null;
	}
</script>

<SubModal title="Change Nickname" {onBack}>
	<div class="flex flex-col items-center gap-5">
		<!-- Current nickname display -->
		<p class="text-3xl font-bold text-white">{draftNickname}</p>

		<!-- Nickname input -->
		<input
			type="text"
			placeholder="Enter new nickname…"
			maxlength="20"
			value={draftNickname}
			oninput={(e) => (draftOverride = e.currentTarget.value)}
			class="w-full px-4 py-3 text-sm text-white placeholder-gray-500 transition border rounded-lg outline-none border-white/10 bg-white/5 focus:border-white/25"
		/>
	</div>

	{#snippet footer()}
		<div class="flex items-center justify-center gap-3">
			<button
				type="button"
				class="btn-primary h-11 w-2/5 text-xs"
				disabled={!hasChanged || saving}
				onclick={keep}
			>
				{saving ? 'SAVING…' : 'KEEP'}
			</button>
			<button
				type="button"
				class="btn-primary h-11 w-2/5 text-xs"
				disabled={!hasChanged || saving}
				onclick={undo}
			>
				UNDO
			</button>
		</div>
	{/snippet}
</SubModal>
