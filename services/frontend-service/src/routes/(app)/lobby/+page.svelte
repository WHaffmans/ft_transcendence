<script lang="ts">
	import LobbyGrid from '$lib/components/lobby/LobbyGrid.svelte';
	import PlayerCard from '$lib/components/lobby/PlayerCard.svelte';
	import WaitingCard from '$lib/components/lobby/WaitingCard.svelte';
	import MatchSettings from '$lib/components/lobby/MatchSettings.svelte';
	import { mockLobbyData } from '$lib/data/lobby';
	import { goto } from '$app/navigation';

	// Get mock data
	const lobbyData = $state(mockLobbyData);

	// Find current user to get their info for navbar
	const currentUser = $derived(
		lobbyData.players.find((p) => p && p.isCurrentUser)
	);

	// Check if current user is host
	const isHost = $derived(
		lobbyData.players.some((p) => p && p.isCurrentUser && p.status === 'host')
	);

	const handleStartGame = () => {
		console.log('Starting game...');
		// TODO: Implement game start logic
	};

	const handleLeaveGame = () => {
		console.log('Leaving lobby...');
		// TODO: Implement leave lobby logic
		goto('/dashboard');
	};

	const handleLogout = () => {
		console.log('Logging out...');
		// TODO: Implement logout logic
		goto('/');
	};
</script>

<svelte:head>
	<title>Lobby - ACHTUNG</title>
</svelte:head>

<section class="relative overflow-hidden">
	<!-- Main content -->
	<div class="flex flex-col items-start justify-between gap-6 lg:flex-row">
		<!-- Left Section - Player Slots -->
		<LobbyGrid>
			{#each lobbyData.players as player}
				{#if player}
					<PlayerCard {player} />
				{:else}
					<WaitingCard />
				{/if}
			{/each}
		</LobbyGrid>

		<!-- Right Section - Match Settings -->
		<div class="w-full lg:w-ranking shrink-0">
			<MatchSettings
				{isHost}
				onStartGame={handleStartGame}
				onLeaveGame={handleLeaveGame}
			/>
		</div>
	</div>
</section>
