<script lang="ts">
  import Navbar from '$lib/components/dashboard/Navbar.svelte';
  import { goto } from '$app/navigation';
  import { mockDashboardData } from '$lib/data/dashboard';
  import { apiStore } from "$lib/stores/api";
  
  let { children } = $props();
  
  // Get mock data
	const data = $state(mockDashboardData);

	const handleLogout = () => {
		console.log('Logging out...');
		apiStore.logout(); //-- implement new api logic none-apistore 
		goto('/');
	};

  const handleOpenSettings = () => {
    // goto('/dashboard/settings');
  };
  
</script>

<!-- Dashboard shell -->
<div class="relative z-10 flex flex-col min-h-screen">
  <!-- Persistent dashboard navigation -->
  <Navbar
    username={data.currentUser.username}
    avatar={data.currentUser.avatar}
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
