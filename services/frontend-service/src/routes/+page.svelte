<script>
  import LoginSection from "$lib/components/LoginSection.svelte";
  import Leaderboard from "$lib/components/Leaderboard.svelte";

  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  // Passing +page.ts data
  let { data } = $props();
  let game = {};
</script>

<!-- Main page content -->
<div class="relative z-10 flex flex-1 items-center justify-center px-8">
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
</div>