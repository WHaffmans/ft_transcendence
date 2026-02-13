<script lang="ts">
	import { userStore } from '$lib/stores/user';

	interface Props {
		player: any;
		position: number;
		isCurrentUser?: boolean;
	}

	let { player, position, isCurrentUser = false }: Props = $props();

	// Use live store values for the current user, static data for others
	let displayName = $derived(isCurrentUser ? ($userStore?.name ?? player.name) : player.name);
	let displayAvatar = $derived(isCurrentUser ? ($userStore?.avatar_url ?? player.avatar_url) : player.avatar_url);

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
	const getBackgroundClass = (pos: number, isUser: boolean): string => {
		if (isUser && pos === 1) return 'bg-[rgba(255,215,0,0.1)] border border-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.5)]';
		// Optional enhanced style for current user in first place
		// if (isUser && pos === 1) return 'bg-[rgba(255,215,0,0.1)] border border-[#ffd700] shadow-[0_0_10px_rgba(255,215,0,0.5)]';
		if (pos === 1) return 'bg-[rgba(255,215,0,0.05)]';
		if (isUser) return 'bg-[rgba(59,130,246,0.1)] border border-[#3b82f6]';
		return '';
	};

	// Determine rank color
	const getRankColor = (pos: number): string => {
		if (pos === 1) return 'text-[#0f8]';
		return 'text-white';
	};

	const positionColorClass = $derived(isCurrentUser && position > 3 ?  'text-[#3b82f6]' : getPositionColor(position));
	const backgroundClass = $derived(getBackgroundClass(position, isCurrentUser));
	const rankColorClass = $derived(getRankColor(position));
</script>

<div
	class="flex items-center justify-between pl-4 pr-5 py-2 rounded-lg {backgroundClass}"
>
	<!-- Left: Position and Player Info -->
	<div class="flex items-center gap-4">
		<!-- Position Number -->
		<p class="text-sm font-bold text-center {positionColorClass}">
			{position}
		</p>

		<!-- Player Info -->
		<div class="flex items-center gap-2">
			<!-- Avatar -->
			<img
				src={displayAvatar || '/placeholders/avatars/placeholder.png'}
				alt={displayName}
				class="w-6 h-6 rounded-full object-cover"
			/>

			<!-- Username -->
			<p class="text-sm font-bold text-white text-center">
				{displayName}
			</p>
		</div>
	</div>

	<!-- Right: Rating -->
	<p class="text-sm font-bold text-center {rankColorClass}">
		{player.rating}
	</p>
</div>
