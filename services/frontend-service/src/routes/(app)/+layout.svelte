<script lang="ts">
  import Navbar from "$lib/components/app/Navbar.svelte";
  import { goto } from "$app/navigation";
  import { toast } from "svelte-sonner";

  let { data, children } = $props();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      if (response.ok) {
        goto("/", { replaceState: true });
        toast.success("Logged out successfully");
      } else {
        toast.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  const handleOpenSettings = () => {
    // goto('/dashboard/settings');
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
