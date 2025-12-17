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
    Dropdown,
    DropdownItem,
    DropdownHeader,
    Navbar,
    NavBrand,
    NavHamburger,
    NavLi,
    DropdownDivider,
    NavUl,
  } from "flowbite-svelte";
  import { ChevronDownOutline } from "flowbite-svelte-icons";

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

<header>
  <Navbar class="bg-gray-800 border-gray-700">
    <NavBrand href="/frontend">
      <span
        class="self-center whitespace-nowrap text-xl font-semibold text-white"
      >
        ft_transcendence
      </span>
    </NavBrand>
    <NavHamburger />
    <NavUl class="md:flex md:items-center lg:items-center justify-center">
      <!-- <NavLi href="/svelte" class="text-gray-300 hover:text-white">Home</NavLi> -->
      <!-- <NavLi href="/svelte/profile" class="text-gray-300 hover:text-white"
        >Profile</NavLi
      > -->
      <NavLi>
        <button class="flex items-center gap-2 text-gray-300 hover:text-white">
          <Avatar size="sm" class="cursor-pointer"
            >{user?.name?.charAt(0).toUpperCase() ?? "U"}</Avatar
          >
          <span class="hidden md:inline">{user?.name}</span>
          <ChevronDownOutline class="w-4 h-4" />
        </button>
        <Dropdown class="w-48 bg-gray-700 border-gray-600">
          <DropdownHeader>
            <span class="block text-sm text-white">{user?.name}</span>
            <span class="block truncate text-sm font-medium text-gray-400"
              >{user?.email}</span
            >
          </DropdownHeader>
          <DropdownItem
            href="/profile"
            class="text-gray-300 hover:bg-gray-600 hover:text-white"
          >
            My Profile
          </DropdownItem>
          <DropdownItem
            class="text-gray-300 hover:bg-gray-600 hover:text-white"
          >
            Settings
          </DropdownItem>
          <DropdownDivider class="border-gray-600" />
          <DropdownItem
            class="text-red-400 hover:bg-gray-600 hover:text-red-300"
          >
            Sign out
          </DropdownItem>
        </Dropdown>
      </NavLi>
    </NavUl>
  </Navbar>
</header>

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
            src={null}
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
