<script lang="ts">
  import Navbar from "$lib/components/app/Navbar.svelte";
  import { modalStore } from "$lib/components/modal/modal";

  let { children } = $props();

  const handleOpenSettings = () => {
    modalStore.open('profileSettings');
  };
</script>

<div class="relative z-10 flex flex-col min-h-screen">
  <!-- App navigation -->
  <nav>
    <Navbar
      onOpenSettings={handleOpenSettings}
    />
  </nav>

  <!-- Main App Content -->
  <main class="flex items-center flex-1 px-6 pb-10 pt-22">
    <div class="w-full mx-auto max-w-308">
      {@render children()}
    </div>
  </main>
</div>
