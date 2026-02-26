<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { ContainerHealth, HealthcheckResponse } from '$lib/types/types';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	let containers = $state<ContainerHealth[]>([]);
	let loading = $state(true);
	let intervalId: ReturnType<typeof setInterval> | undefined;

	async function fetchHealth() {
		try {
			const res = await fetch('/healthcheck');
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data: HealthcheckResponse = await res.json();
			containers = data.containers;
		} catch {
			containers = containers.map((c) => ({ ...c, status: 'unhealthy' as const }));
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchHealth();
		intervalId = setInterval(fetchHealth, 10_000);
	});

	onDestroy(() => {
		if (intervalId) clearInterval(intervalId);
	});
</script>

{#if !loading}
	<div class="flex items-center gap-2 {className}">
		{#each containers as container}
			<div class="group flex items-center gap-1.5 rounded-full px-1 py-0.5 transition-all duration-600 hover:bg-gray-800/80 hover:pr-2.5 hover:pl-1.5">
				<span
					class="inline-block h-2 w-2 shrink-0 rounded-full {container.status === 'healthy'
						? 'bg-[#0f8] shadow-[0_0_4px_#0f8]'
						: 'bg-[#f36] shadow-[0_0_4px_#f36]'}"
				></span>
				<span class="max-w-0 overflow-hidden whitespace-nowrap text-xs text-gray-300 opacity-0 transition-all duration-600 group-hover:max-w-40 group-hover:opacity-100">
					{container.name}
				</span>
			</div>
		{/each}
	</div>
{/if}
