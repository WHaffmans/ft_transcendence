<script>
  import BackgroundDecorations from '$lib/components/BackgroundDecorations.svelte';
  import LoginSection from '$lib/components/LoginSection.svelte';
  import Leaderboard from '$lib/components/Leaderboard.svelte';
  import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
  <title>Achtung - Landing Page</title>
</svelte:head>

<div class="relative w-full min-h-screen overflow-hidden" style="background-color: #121212;">
  <!-- Background Decorations -->
  <BackgroundDecorations />

  <!-- Main Content -->
  <div class="relative z-10 flex items-center justify-center min-h-screen px-8">
    <div class="flex flex-col lg:flex-row gap-[180px] items-center justify-center">
      <!-- Login Section -->
      <LoginSection />

      <!-- Leaderboard -->
      <Leaderboard />
    </div>
  </div>

  <!-- Footer -->
  <Footer />
</div>
