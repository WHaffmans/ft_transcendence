<script lang="ts">
	import DashboardNav from '$lib/components/dashboard/DashboardNav.svelte';
	import GlobalRanking from '$lib/components/dashboard/GlobalRanking.svelte';
	import StatCard from '$lib/components/dashboard/StatCard.svelte';
	import { mockDashboardData } from '$lib/data/dashboard';
	import { goto } from '$app/navigation';

	// Get mock data
	const data = $state(mockDashboardData);

	const handleFindMatch = () => {
		console.log('Finding match...');
		// TODO: Implement match finding logic
	};

	const handleLogout = () => {
		console.log('Logging out...');
		// TODO: Implement logout logic
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
		<div class="absolute -top-[300px] -right-[300px] w-[600px] h-[600px]">
			<img
				src="/assets/ellipse-top-right.svg"
				alt=""
				class="w-full h-full object-contain opacity-80"
				style="filter: blur(40px) brightness(1.2);"
			/>
		</div>

		<!-- Bottom left ellipse -->
		<div class="absolute -bottom-[300px] -left-[300px] w-[600px] h-[600px]">
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
	<main class="relative z-10 pt-[88px] pb-10 px-6">
		<div class="max-w-[1232px] mx-auto">
			<div class="flex flex-col lg:flex-row items-start justify-between gap-6">
				<!-- Left Section -->
				<div class="flex flex-col gap-6 w-full lg:w-[850px]">
					<!-- Play Game Card -->
				<div class="glass h-[var(--height-card)] rounded-2xl relative overflow-hidden">
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
												vs. {data.lastMatch.opponent}
											</p>
											<span class="text-sm font-bold {data.lastMatch.result === 'WIN' ? 'text-[#0f8]' : 'text-red-500'}">
												{data.lastMatch.result}
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
				<div class="w-full lg:w-auto flex-shrink-0">
					<GlobalRanking
						topPlayers={data.globalRanking}
						currentUser={data.currentUser}
					/>
				</div>
			</div>
		</div>
	</main>
</div>
