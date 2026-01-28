<script lang="ts">
	import Navbar from '$lib/components/app/Navbar.svelte';
	
	import { apiStore } from "$lib/stores/api";
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	// TO REMOVE
	import { mockDashboardData } from '$lib/data/dashboard';
	const data = $state(mockDashboardData);
	// ----

	let { children } = $props();

	const handleLogout = () => {
		console.log('Logging out...');
		apiStore.logout().then(() => {
			toast.success("Successfully logged out.");
			goto('/', { replaceState: true });
		}).catch((error) => {
			console.error("Logout failed:", error);
			toast.error("Failed to log out. Please try again.");
		});
	};

  const handleOpenSettings = () => {
    // goto('/dashboard/settings');
  };

</script>

<div class="relative z-10 flex flex-col min-h-screen">
	<!-- App navigation -->
	<nav>
		<Navbar
    username={data.currentUser.username}
    avatar={data.currentUser.avatar}
    onLogout={handleLogout}
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


