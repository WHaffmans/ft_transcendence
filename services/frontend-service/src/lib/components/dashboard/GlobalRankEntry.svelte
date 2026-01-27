<script lang="ts">
	import type { RankingPlayer } from '$lib/types/types';

	interface Props {
		player: RankingPlayer;
		isCurrentUser?: boolean;
	}

	let { player, isCurrentUser = false }: Props = $props();

	// Determine position color based on rank
	const getPositionColor = (position: number): string => {
		switch (position) {
			case 1:
				return 'text-[#ffd700]'; // Gold
			case 2:
				return 'text-[#c0c0c0]'; // Silver
			case 3:
				return 'text-[#cd7f32]'; // Bronze
			default:
				return 'text-[#888]'; // Gray
		}
	};

	// Determine background for top 1
	const getBackgroundClass = (position: number, isUser: boolean): string => {
		if (isUser) return 'bg-[rgba(59,130,246,0.1)] border border-[#3b82f6]';
		if (position === 1) return 'bg-[rgba(255,215,0,0.05)]';
		return '';
	};

	// Determine rank color
	const getRankColor = (position: number): string => {
		if (position === 1) return 'text-[#0f8]';
		return 'text-white';
	};

	const positionColorClass = $derived(isCurrentUser ? 'text-[#3b82f6]' : getPositionColor(player.position));
	const backgroundClass = $derived(getBackgroundClass(player.position, isCurrentUser));
	const rankColorClass = $derived(getRankColor(player.position));
</script>

<div
	class="flex items-center justify-between pl-4 pr-5 py-2 rounded-lg {backgroundClass}"
>
	<!-- Left: Position and Player Info -->
	<div class="flex items-center gap-4">
		<!-- Position Number -->
		<p class="text-sm font-bold text-center {positionColorClass}">
			{player.position}
		</p>

		<!-- Player Info -->
		<div class="flex items-center gap-2">
			<!-- Avatar -->
			<img
				src={player.avatar}
				alt={player.username}
				class="w-6 h-6 rounded-full object-cover"
			/>

			<!-- Username -->
			<p class="text-sm font-bold text-white text-center">
				{player.username}
			</p>
		</div>
	</div>

	<!-- Right: Rank Score -->
	<p class="text-sm font-bold text-center {rankColorClass}">
		{player.rank}
	</p>
</div>
