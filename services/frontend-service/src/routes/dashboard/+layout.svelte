<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import Navbar from "$lib/components/dashboard/Navbar.svelte";
  import { apiStore } from "$lib/stores/api";
  import { toast } from "svelte-sonner";

  let { data, children } = $props();

  const handleLogout = async () => {
    console.log("Logging out...");
    const success = await apiStore.logout();
    if (success) {
      await invalidateAll();
      goto("/", { replaceState: true });
      toast.success("Logged out successfully");
    } else {
      toast.error("Logout failed");
    }
  };

  const handleOpenSettings = () => {
    // goto('/dashboard/settings');
  };
</script>

<!-- Dashboard shell -->
<div class="relative z-10 flex flex-col min-h-screen">
  <!-- Persistent dashboard navigation -->
  <Navbar
    username={data.user?.name ?? "Guest"}
    avatar={data.user?.avatar_url ?? ""}
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
