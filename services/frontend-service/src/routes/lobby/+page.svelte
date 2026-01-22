<script lang="ts">
	import DashboardNav from '$lib/components/dashboard/DashboardNav.svelte';
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

<!-- Lobby container with background -->
<div class="relative min-h-screen bg-[#121212] overflow-hidden">
	<!-- Background decorations -->
	<div class="absolute inset-0 pointer-events-none overflow-hidden">
		<!-- Top right ellipse -->
		<div class="absolute -top-75 -right-75 w-150 h-150">
			<img
				src="/assets/ellipse-top-right.svg"
				alt=""
				class="w-full h-full object-contain opacity-80"
				style="filter: blur(40px) brightness(1.2);"
			/>
		</div>

		<!-- Bottom left ellipse -->
		<div class="absolute -bottom-75 -left-75 w-150 h-150">
			<img
				src="/assets/ellipse-bottom-left.svg"
				alt=""
				class="w-full h-full object-contain opacity-80"
				style="filter: blur(40px) brightness(1.2);"
			/>
		</div>
	</div>

	<!-- Navigation -->
	{#if currentUser}
		<DashboardNav
			username={currentUser.username}
			avatar={currentUser.avatar}
			onLogout={handleLogout}
		/>
	{/if}

	<!-- Main content -->
	<main class="relative z-10 pt-22 pb-10 px-6">
		<div class="max-w-308 mx-auto">
			<div class="flex flex-col lg:flex-row items-start justify-between gap-6">
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
				<div class="w-full lg:w-[var(--width-ranking)] shrink-0">
					<MatchSettings
						{isHost}
						onStartGame={handleStartGame}
						onLeaveGame={handleLeaveGame}
					/>
				</div>
			</div>
		</div>
	</main>
</div>
