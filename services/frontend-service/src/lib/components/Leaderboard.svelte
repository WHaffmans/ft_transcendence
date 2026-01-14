<script lang="ts">
  import LeaderboardEntry from "./LeaderboardEntry.svelte";
  import { leaderboardData } from "../data/leaderboard";
  import { onMount } from "svelte";
  import { User } from "$lib/types/types";

  let players: User[] = [];

  onMount(() => {
    // In a real application, you would fetch this data from an API
    fetch("/api/leaderboard", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard data");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Leaderboard data:", data);
        players = data;
      })
      .catch((error) => {
        console.error("Error fetching leaderboard data:", error);
      });
  });
</script>

<div
  class="
  backdrop-blur-[20px] bg-[rgba(26,26,26,0.6)]
  border border-[rgba(255,255,255,0.1)] rounded-[24px]
  w-[400px] h-[500px]
  flex flex-col gap-[43px] items-center
  px-[22px] py-[23px] shrink-0
"
>
  <!-- Title -->
  <h2 class="text-sm font-bold text-[#666] text-center whitespace-pre shrink-0">
    TOP PLAYERS
  </h2>

  <!-- Leaderboard Entries -->
  <div class="flex flex-col gap-[5px] items-center w-full shrink-0">
    {#each players as player, index}
      <LeaderboardEntry {player} />
      {#if index < players.length - 1}
        <div
          class="w-[274px] h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent opacity-60"
        >
      </div>
      {/if}
    {/each}
  </div>
</div>
