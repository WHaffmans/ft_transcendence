<script lang="ts">
	import { toast } from 'svelte-sonner';
	import DashboardNav from '$lib/components/dashboard/DashboardNav.svelte';
	import GlobalRanking from '$lib/components/dashboard/GlobalRanking.svelte';
	import StatCard from '$lib/components/dashboard/StatCard.svelte';
	import { mockDashboardData } from '$lib/data/dashboard';
	import { goto } from '$app/navigation';
	import { apiStore } from "$lib/stores/api";
	
	// Get mock data
	const data = $state(mockDashboardData);
	
	const handleFindMatch = () => {
		console.log('Finding match...');

		if (!$apiStore.isAuthenticated) {
			toast.error("You must be logged in to find a game.");
			return;
		}

		apiStore.fetchApi("/games/find")
      .then((game) => {
		  	console.log("Game found:", game);
		  	goto(`/lobby/${game.id}`);
		  })
      .catch((error) => {
		  	console.error("Error finding game:", error);
		  	toast.error("Failed to find a game. Please try again later.");});
	};

	const handleLogout = () => {
		console.log('Logging out...');
		apiStore.logout();
		goto('/');
	};
</script>

<svelte:head>
	<title>Dashboard - ACHTUNG</title>
</svelte:head>

<!-- Dashboard container with background -->
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
	<DashboardNav
		username={data.currentUser.username}
		avatar={data.currentUser.avatar}
		onLogout={handleLogout}
	/>

	<!-- Main content -->
	<main class="relative z-10 pt-22 pb-10 px-6">
		<div class="max-w-308 mx-auto">
			<div class="flex flex-col lg:flex-row items-start justify-between gap-6">
				<!-- Left Section -->
				<div class="flex flex-col gap-6 w-full lg:w-212.5">
					<!-- Play Game Card -->
				<div class="glass h-card rounded-2xl relative overflow-hidden">
						<div class="absolute inset-0 p-10 flex flex-col justify-start">
							<h2 class="text-[48px] font-bold text-white leading-tight mb-1">
								Ready to Curve?
							</h2>
							<p class="text-sm font-bold text-[#888] mb-10">
								{data.serverStatus.name} • {data.serverStatus.playersOnline} Players Online
							</p>

							<!-- Find Match Button -->
							<button
								onclick={handleFindMatch}
								class="w-55 h-14 bg-white text-black font-bold text-sm rounded-lg shadow-[0px_4px_15px_0px_rgba(255,255,255,0.25)] hover:shadow-[0px_6px_20px_0px_rgba(255,255,255,0.35)] transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
							>
								<span class="w-2 h-2 bg-[#0f8] rounded-full animate-pulse"></span>
								<span>FIND MATCH</span>
							</button>
						</div>
					</div>

					<!-- Bottom Cards Row -->
					<div class="flex flex-col sm:flex-row gap-6">
						<!-- Current Rank Card -->
						<StatCard title="Current Rank">
							{#snippet children()}
								<div class="flex-1 flex items-center justify-center">
									<p class="text-[64px] font-bold text-white leading-none">
										{data.currentUser.rank}
									</p>
								</div>
							{/snippet}
						</StatCard>

						<!-- Last Match Card -->
						{#if data.lastMatch}
							<StatCard title="Last Match">
								{#snippet children()}
									<div class="flex-1 flex items-start pt-6">
										<div class="flex items-center justify-between w-full">
											<p class="text-lg font-medium text-white">
												vs. {data.lastMatch?.opponent}
											</p>
											<span class="text-sm font-bold {data.lastMatch?.result === 'WIN' ? 'text-[#0f8]' : 'text-red-500'}">
												{data.lastMatch?.result}
											</span>
										</div>
									</div>
								{/snippet}
							</StatCard>
						{:else}
							<StatCard title="Last Match">
								{#snippet children()}
									<div class="flex-1 flex items-center justify-center">
										<p class="text-base text-[#888]">No matches yet</p>
									</div>
								{/snippet}
							</StatCard>
						{/if}
					</div>
				</div>

				<!-- Right Section - Global Ranking -->
				<div class="w-full lg:w-auto shrink-0">
					<GlobalRanking
						topPlayers={data.globalRanking}
						currentUser={data.currentUser}
					/>
				</div>
			</div>
		</div>
	</main>
</div>
