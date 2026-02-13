<script lang="ts">
	import GlobalRankEntry from './GlobalRankEntry.svelte';
	import Footer from '$lib/components/Footer.svelte'

	interface Props {
		leaderboard: any[];
		currentUser: any;
		userPosition: number;
	}

	let { leaderboard, currentUser, userPosition }: Props = $props();
</script>

<div class="relative flex flex-col w-full glass h-ranking lg:w-ranking rounded-2xl">
	<!-- Header -->
	<div class="flex flex-col gap-2.5 px-6 pt-6">
		<p class="text-xs font-bold text-[#888] uppercase">Global Ranking</p>
		<div class="w-full h-px bg-white/10"></div>
	</div>

	<!-- Column Headers -->
	<div class="flex items-center justify-between px-7 text-[10px] font-medium text-[#666] mt-3 mb-2">
		<div class="flex items-center gap-13">
			<span>#</span>
			<span>PLAYER</span>
		</div>
		<span>RATING</span>
	</div>

	<!-- Top 5 Players -->
	<div class="flex flex-col gap-1 px-2 mb-auto">
		{#each leaderboard.slice(0, 5) as player, index (player.id)}
			{#if currentUser && player.id === currentUser.id}
				<GlobalRankEntry 
					player={player} 
					position={index + 1} 
					isCurrentUser={true} 
				/>
			{:else}
				<GlobalRankEntry 
					player={player} 
					position={index + 1} 
				/>
			{/if}
		{/each}
	</div>

	<!-- Separator dots -->
	<div class="flex justify-center py-4">
		<p class="text-[#444] font-bold text-xl text-center">...</p>
	</div>

	<!-- Current User Position -->
	{#if currentUser && userPosition > 5}
		<div class="px-2 pb-4">
			<GlobalRankEntry 
				player={currentUser} 
				position={userPosition}
				isCurrentUser={true} 
			/>
		</div>
	{/if}

	<!-- Footer -->
	<div class="px-6 pt-6 pb-6">
		<Footer textSize="card"/>
	</div>
</div>
