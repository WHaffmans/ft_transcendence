<script lang="ts">
  import { onMount } from "svelte";
  import { apiStore } from "$lib/stores/api";
  import { goto } from "$app/navigation";

  // Subscribe to the auth store
  const auth = apiStore;

  let game = {};

  const findGame = () => {
    // api call to backend to find a game
    fetch("/api/games/find", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to find a game");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Game found:", data);
        // update ui
        game = data;
        goto(`/lobby/${data.id}`);
      })
      .catch((error) => {
        console.error("Error finding game:", error);
      });
  };

  onMount(() => {
    auth.init();
  });
</script>

<header
  class="flex flex-col items-center justify-between p-4 bg-gray-800 text-white"
>
  ft_transcendence

  {#if $auth.isLoading}
    <div class="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
  {:else if $auth.isAuthenticated && $auth.user}
    <span>{$auth.user.name}</span>
    <span>{$auth.user.email}</span>
    {#if $auth.user.avatarUrl}
      <img
        src={$auth.user.avatarUrl}
        alt="User Avatar"
        class="w-12 h-12 rounded-full"
      />
    {/if}
    <button onclick={findGame}>Find Game</button>

    <button
      onclick={() => auth.logout()}
      class="text-red-400 hover:bg-gray-600 hover:text-red-300"
    >
      Sign out
    </button>
  {:else}
    <a href="/login">Login</a>
  {/if}
  {#if game}
    <pre>
{JSON.stringify(game, null, 2)}
    </pre>
  {/if}
</header>
