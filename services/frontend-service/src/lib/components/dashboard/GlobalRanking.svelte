<script lang="ts">
	import GlobalRankEntry from './GlobalRankEntry.svelte';
	import type { RankingPlayer } from '$lib/types/types';

	interface Props {
		topPlayers: RankingPlayer[];
		currentUser: {
			username: string;
			avatar: string;
			rank: number;
			position: number;
		};
	}

	let { topPlayers, currentUser }: Props = $props();

	// Create current user player object
	const currentUserPlayer: RankingPlayer = $derived({
		position: currentUser.position,
		username: currentUser.username,
		rank: currentUser.rank,
		avatar: currentUser.avatar
	});
</script>

<div class="glass h-[var(--height-ranking)] w-full lg:w-[var(--width-ranking)] rounded-2xl flex flex-col relative">
	<!-- Header -->
	<div class="flex flex-col gap-2.5 px-6 pt-6">
		<p class="text-xs font-bold text-[#888] uppercase">Global Ranking</p>
		<div class="h-px w-full bg-white/10"></div>
	</div>

	<!-- Column Headers -->
	<div class="flex items-center justify-between px-6 text-[10px] font-medium text-[#666] mt-3 mb-2">
		<div class="flex items-center gap-[52px]">
			<span>#</span>
			<span>PLAYER</span>
		</div>
		<span>RANK</span>
	</div>

	<!-- Top 5 Players -->
	<div class="flex flex-col gap-1 px-2 mb-auto">
		{#each topPlayers as player (player.position)}
			<GlobalRankEntry {player} />
		{/each}
	</div>

	<!-- Separator dots -->
	<div class="flex justify-center py-4">
		<p class="text-[#444] font-bold text-xl text-center">...</p>
	</div>

	<!-- Current User Position -->
	<div class="px-2 pb-4">
		<GlobalRankEntry player={currentUserPlayer} isCurrentUser={true} />
	</div>

	<!-- Footer -->
	<div class="px-6 pb-6 pt-2">
		<p class="text-[10px] font-normal text-[#444] text-center">
			Privacy Policy • Terms of Service
		</p>
	</div>
</div>
