<script lang="ts">
  import { goto } from "$app/navigation";
  import { apiStore } from "$lib/stores/api";
  import { toast } from "svelte-sonner";

  const landingLogo = "/logo.webp";

  const handleLogin = async () => {
    const result = await apiStore.login();
    if (result?.success) {
      toast.success("Welcome! Login successful");
      goto("/dashboard", { invalidateAll: true });
    } else {
      toast.error(`Login failed: ${result?.errorDescription || result?.error}`);
    }
  };
</script>

<section class="flex flex-col items-center w-full max-w-150 shrink-0 px-4">
  <!-- Logo and Subtitle Frame -->
  <header class="relative w-full max-w-150 aspect-[600/327] mb-8">
    <!-- Logo Image -->
    <img
      src={landingLogo}
      alt="Achtung Logo"
      class="absolute inset-0 object-cover w-full h-full pointer-events-none"
    />
  </header>

  <!-- Primary call to action -->
  <button
    onclick={handleLogin}
    class="bg-white text-black font-bold text-[18px] px-16.75 py-5.25 rounded-xl shadow-button ease-out w-75 max-w-full h-16 flex items-center justify-center cursor-pointer"
  >
    Login
  </button>
</section>
