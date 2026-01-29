<script>
  import LoginSection from "$lib/components/LoginSection.svelte";
  import Leaderboard from "$lib/components/Leaderboard.svelte";
  import Footer from "$lib/components/Footer.svelte";

  import { onMount } from "svelte";
  import { apiStore } from "$lib/stores/api";
  import { goto } from "$app/navigation";

  // Passing +page.ts data
  let { data } = $props();
  
  // Subscribe to the auth store
  const auth = apiStore;

  let game = {};

  onMount(() => {
    auth.init();
  });
</script>

<svelte:head>
  <title>Achtung - Landing Page</title>
</svelte:head>

<!-- Main page content -->
<main class="relative z-10 flex items-center justify-center min-h-screen px-8">
  <!-- Width constrainment -->
  <div class="w-full max-w-7xl">
    <!-- Split layout -->
    <section class="grid items-start grid-cols-1 gap-16 lg:grid-cols-2">
      <!-- Login section -->
      <div class="flex justify-center">
        <LoginSection />
      </div>

      <!-- Leaderboard -->
      <div class="flex justify-center">
        <Leaderboard players={data.players} />
      </div>
    </section>
  </div>
</main>

<Footer />