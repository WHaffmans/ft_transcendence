<script>
  import BackgroundDecorations from "$lib/components/BackgroundDecorations.svelte";
  import LoginSection from "$lib/components/LoginSection.svelte";
  import Leaderboard from "$lib/components/Leaderboard.svelte";
  import Footer from "$lib/components/Footer.svelte";

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

<svelte:head>
  <title>Achtung - Landing Page</title>
</svelte:head>

<div
  class="relative w-full min-h-screen overflow-hidden"
  style="background-color: #121212;"
>
  <!-- Background Decorations -->
  <BackgroundDecorations />

  <!-- Main Content -->
  <div class="relative z-10 flex items-center justify-center min-h-screen px-8">
    <div
      class="flex flex-col lg:flex-row gap-[180px] items-center justify-center"
    >
      <!-- Login Section -->
      <LoginSection />

      <!-- Leaderboard -->
      <Leaderboard players={[]} />
    </div>
  </div>

  <!-- Footer -->
  <Footer />
</div>
