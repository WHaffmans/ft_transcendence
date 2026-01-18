<script lang="ts">
  import LeaderboardEntry from "./LeaderboardEntry.svelte";
  import type { User } from "$lib/types/types";

  let { players }: { players: User[]; } = $props();
</script>

<section class="flex flex-col w-full p-6 space-y-10 glass rounded-3xl max-w-100 max-h-125">
  <!-- Title -->
  <h2 class="text-sm font-bold text-[#666] text-center">
    TOP PLAYERS
  </h2>

  <!-- Leaderboard Entries -->
  <ul class="flex flex-col items-center w-full space-y-1 overflow-hidden">
    {#each players as player, index}
      <li class="w-full">
        <LeaderboardEntry {player} />
        {#if index < players.length - 1}
        <hr class="w-full h-px border-0 bg-linear-to-r from-transparent via-gray-700 to-transparent opacity-60" />
        {/if}
      </li>
    {/each}
  </ul>
</section>
