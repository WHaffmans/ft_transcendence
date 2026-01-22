<script lang="ts">
  import GlobalRanking from '$lib/components/dashboard/GlobalRanking.svelte';
  import StatCard from '$lib/components/dashboard/StatCard.svelte';
  import { mockDashboardData } from '$lib/data/dashboard';

  const data = $state(mockDashboardData);

  const handleFindMatch = () => {
    console.log('Finding match...');
  };
</script>

<svelte:head>
  <title>Dashboard – ACHTUNG</title>
</svelte:head>

<!-- Dashboard page content -->
<section class="flex flex-col gap-6 lg:flex-row">
  <!-- Left column -->
  <div class="flex w-full flex-col gap-6 lg:w-[68%]">
    <!-- Play card -->
    <section class="relative overflow-hidden h-card rounded-2xl glass">
      <div class="absolute inset-0 flex flex-col justify-start p-10">
        <h2 class="text-[48px] font-bold leading-tight text-white">
          Ready to Curve?
        </h2>
        <p class="mb-10 text-sm font-bold text-neutral-400">
          {data.serverStatus.name} • {data.serverStatus.playersOnline} Players Online
        </p>

        <button
          onclick={handleFindMatch}
          class="flex h-14 w-55 items-center justify-center gap-2 rounded-lg bg-white text-sm font-bold text-black shadow-lg transition hover:-translate-y-0.5"
        >
          <span class="h-2 w-2 animate-pulse rounded-full bg-[#0f8]"></span>
          FIND MATCH
        </button>
      </div>
    </section>

    <!-- Stats row -->
    <section class="flex flex-col gap-6 sm:flex-row">
      <StatCard title="Current Rank">
        {#snippet children()}
          <div class="flex items-center justify-center flex-1">
            <p class="text-[64px] font-bold text-white leading-none">
              {data.currentUser.rank}
            </p>
          </div>
        {/snippet}
      </StatCard>

      <StatCard title="Last Match">
        {#snippet children()}
          {#if data.lastMatch}
            <div class="flex items-center justify-between w-full pt-6">
              <p class="text-lg font-medium text-white">
                vs. {data.lastMatch.opponent}
              </p>
              <span class="text-sm font-bold">
                {data.lastMatch.result}
              </span>
            </div>
          {:else}
            <p class="text-neutral-400">No matches yet</p>
          {/if}
        {/snippet}
      </StatCard>
    </section>
  </div>

  <!-- Right column -->
  <aside class="w-full shrink-0 lg:w-auto">
    <GlobalRanking
      topPlayers={data.globalRanking}
      currentUser={data.currentUser}
    />
  </aside>
</section>
