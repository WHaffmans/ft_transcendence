<script lang="ts">
  import Navbar from "$lib/components/app/Navbar.svelte";
  import { goto } from "$app/navigation";
  import { toast } from "svelte-sonner";
  import { apiStore } from "$lib/stores/api";
  import { modalStore } from "$lib/components/modal/modal";

  let { data, children } = $props();

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
    modalStore.open('profileSettings');
  };
</script>

<div class="relative z-10 flex flex-col min-h-screen">
  <!-- App navigation -->
  <nav>
    <Navbar
      username={data.user?.name ?? "Guest"}
      avatar={data.user?.avatar_url ?? ""}
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
