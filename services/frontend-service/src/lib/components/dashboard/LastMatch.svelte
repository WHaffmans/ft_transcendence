<script lang="ts">
	import type { LastMatchData } from '../../../routes/(app)/dashboard/+page.server';

	interface Props {
		match: LastMatchData;
	}

	let { match }: Props = $props();

	function formatDelta(delta: number): string {
		const sign = delta >= 0 ? '+' : '';
		return `${sign}${delta.toFixed(2)}`;
	}
</script>

<div class="flex flex-col h-full w-full gap-3">
	<!-- Header row -->
	<div class="flex items-center justify-between">
		<span class="text-xs font-medium text-[#555]">{match.date}</span>
	</div>

	<!-- Player rows -->
	<div class="flex flex-col gap-2">
		{#each match.players as player (player.id)}
			<div
				class="flex items-center justify-between rounded-lg px-3 py-2 {player.isCurrentUser
					? 'bg-white/6'
					: ''}"
			>
				<!-- Left: rank position + name -->
				<div class="flex items-center gap-2 min-w-0">
					<span class="text-xs font-bold text-[#555] w-4 shrink-0">
						#{player.rank}
					</span>
					<span
						class="text-sm font-medium truncate {player.isCurrentUser
							? 'text-white'
							: 'text-neutral-400'}"
					>
						{player.name}
					</span>
				</div>

				<!-- Right: rating + delta -->
				<div class="flex items-center gap-3 shrink-0">
					<span class="text-sm font-semibold text-white tabular-nums">
						{player.rating.toFixed(2)}
					</span>
					{#if player.delta !== null}
						<span
							class="text-xs font-bold tabular-nums {player.delta >= 0
								? 'text-[#00FF88]'
								: 'text-[#FF3366]'}"
						>
							{formatDelta(player.delta)}
						</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
