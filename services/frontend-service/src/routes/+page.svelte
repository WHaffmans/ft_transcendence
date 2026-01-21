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

  onMount(() => {
    auth.init();
  });
</script>

<svelte:head>
  <title>Achtung - Landing Page</title>
</svelte:head>

<!-- Background Decorations -->
<div
  class="absolute w-full min-h-screen overflow-hidden"
  style="background-color: #121212;"
>
  <BackgroundDecorations />
</div>
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
  <!-- Footer -->
  <Footer />
</div>
