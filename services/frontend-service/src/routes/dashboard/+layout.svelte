<script lang="ts">
  import Navbar from '$lib/components/dashboard/Navbar.svelte';
  import { goto } from '$app/navigation';

  let { children } = $props();

  const handleLogout = () => {
    goto('/');
  };

  const handleOpenSettings = () => {
    goto('/dashboard/settings');
  };
</script>

<!-- Dashboard shell -->
<div class="relative z-10 flex flex-col min-h-screen">
  <!-- Persistent dashboard navigation -->
  <Navbar
    username="Player"
    avatar="/assets/avatar-placeholder.png"
    onLogout={handleLogout}
    onOpenSettings={handleOpenSettings}
  />

  <!-- Dashboard content outlet -->
  <main class="flex items-center flex-1 px-6 pb-10 pt-22">
    <!-- Width constrainment -->
    <div class="w-full mx-auto max-w-300">
      {@render children()}
    </div>
  </main>
</div>
