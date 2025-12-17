<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import type { User } from "../../lib/types/types";
  import {
    Card,
    Button,
    Avatar,
    Heading,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Badge,
  } from "flowbite-svelte";

  let user: User | null = null;

  // Mock data for games and leaderboard
  const recentGames = [
    {
      id: 1,
      opponent: "Player2",
      result: "Win",
      score: "10 - 5",
      date: "2023-10-25",
    },
    {
      id: 2,
      opponent: "Player3",
      result: "Loss",
      score: "8 - 10",
      date: "2023-10-24",
    },
    {
      id: 3,
      opponent: "Player4",
      result: "Win",
      score: "10 - 2",
      date: "2023-10-23",
    },
  ];

  const leaderboard = [
    { rank: 1, name: "Player1", points: 1500 },
    { rank: 2, name: "Player2", points: 1450 },
    { rank: 3, name: "Player3", points: 1400 },
    { rank: 4, name: "Player4", points: 1350 },
    { rank: 5, name: "Player5", points: 1300 },
  ];

  const fetchUser = async () => {
    const response = await fetch("/auth/api/user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });
    if (!response.ok) {
      throw new Error("Health check failed");
    }
    return await response.json();
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    goto("/login");
  };

  if (browser) {
    onMount(async () => {
      try {
        const data = await fetchUser();
        user = data;
      } catch (error) {
        console.error(error);
        // Optional: redirect to login if fetch fails
      }
    });
  }
</script>

<div class="min-h-screen bg-gray-900 text-white p-8">
  <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Left Column: Dashboard -->
    <div class="lg:col-span-2 space-y-8">
      <!-- Recent Games -->
      <Card size="xl" class="w-full bg-gray-800 border-gray-700">
        <Heading tag="h3" class="mb-4 p-4 text-xl font-bold text-white"
          >Recent Games</Heading
        >
        <Table hoverable={true} class="text-gray-300">
          <TableHead class="text-gray-400 bg-gray-700">
            <TableHeadCell>Opponent</TableHeadCell>
            <TableHeadCell>Result</TableHeadCell>
            <TableHeadCell>Score</TableHeadCell>
            <TableHeadCell>Date</TableHeadCell>
          </TableHead>
          <TableBody>
            {#each recentGames as game}
              <TableBodyRow
                class="bg-gray-800 border-gray-700 hover:bg-gray-700"
              >
                <TableBodyCell>{game.opponent}</TableBodyCell>
                <TableBodyCell>
                  {#if game.result === "Win"}
                    <Badge color="green">Win</Badge>
                  {:else}
                    <Badge color="red">Loss</Badge>
                  {/if}
                </TableBodyCell>
                <TableBodyCell>{game.score}</TableBodyCell>
                <TableBodyCell>{game.date}</TableBodyCell>
              </TableBodyRow>
            {/each}
          </TableBody>
        </Table>
      </Card>

      <!-- Leaderboard -->
      <Card size="xl" class="w-full bg-gray-800 border-gray-700">
        <Heading tag="h3" class="mb-4 p-4 text-xl font-bold text-white"
          >Leaderboard</Heading
        >
        <Table hoverable={true} class="text-gray-300">
          <TableHead class="text-gray-400 bg-gray-700">
            <TableHeadCell>Rank</TableHeadCell>
            <TableHeadCell>Player</TableHeadCell>
            <TableHeadCell>Points</TableHeadCell>
          </TableHead>
          <TableBody>
            {#each leaderboard as player}
              <TableBodyRow
                class="bg-gray-800 border-gray-700 hover:bg-gray-700"
              >
                <TableBodyCell>{player.rank}</TableBodyCell>
                <TableBodyCell>{player.name}</TableBodyCell>
                <TableBodyCell>{player.points}</TableBodyCell>
              </TableBodyRow>
            {/each}
          </TableBody>
        </Table>
      </Card>
    </div>

    <!-- Right Column: User Management -->
    <div class="lg:col-span-1">
      <Card
        size="xl"
        class="w-full bg-gray-800 border-gray-700 flex flex-col items-center text-center"
      >
        <div class="flex flex-col items-center pt-10 pb-10">
          <Avatar
            size="lg"
            class="mb-3 shadow-lg"
            src={user?.avatar || ""}
            alt={user?.name}
          />
          <h5 class="mb-1 text-xl font-medium text-white">
            {user?.name || "Loading..."}
          </h5>
          <span class="text-sm text-gray-400">{user?.email || ""}</span>

          <div class="flex mt-4 space-x-3 lg:mt-6">
            <Button color="light" class="mr-2">Change Picture</Button>
            <Button color="blue">Edit Profile</Button>
          </div>
          <div class="flex mt-4 space-x-3 lg:mt-6 w-full justify-center">
            <Button color="amber" onclick={handleLogout} class="w-full max-w-xs"
              >Logout</Button
            >
          </div>
        </div>
      </Card>
    </div>
  </div>
</div>
