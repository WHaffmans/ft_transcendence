<script lang="ts">
  import { goto } from "$app/navigation";
  import { apiStore } from "$lib/stores/api";
  import { toast } from "svelte-sonner";
  import SignInButton from "./SignInButton.svelte";

  const landingLogo = "/logo.png";
  const subtitle = "The Kurve Web Edition";

  const handleLogin = async () => {
    const success = await apiStore.login();
    if (success) {
      toast.success("Welcome back!");
      goto("/dashboard");
    } else {
      toast.error("Login failed");
    }
  };
</script>

<section class="flex flex-col items-center w-150 shrink-0">
  <!-- Logo and Subtitle Frame -->
  <header class="relative w-150 h-81.75 mb-8">
    <!-- Subtitle (overlaps under logo) -->
    <p
      class="absolute left-4/9 top-19/30 -translate-x-1/2 text-center text-[#888] text-[24px] font-medium tracking-[-1.2px] whitespace-nowrap"
    >
      {subtitle}
    </p>
    <!-- Logo Image -->
    <img
      src={landingLogo}
      alt="Achtung Logo"
      class="absolute inset-0 object-cover w-full h-full pointer-events-none"
    />
  </header>

  <!-- Primary call to action -->
  <SignInButton onClick={handleLogin} label="Login" />
</section>
