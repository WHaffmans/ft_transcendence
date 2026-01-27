<script>
  import { goto } from "$app/navigation";
  import { apiStore } from "$lib/stores/api";
  import SignInButton from "./SignInButton.svelte";

  const landingLogo = "/logo.png";
  const subtitle = "The Kurve Web Edition";

  const handleLogin = async () => {
    console.log("Sign in clicked");
    const success = await apiStore.login();
    if (success) {
      console.log("Login successful!");
      window.location.reload();
    } else {
      console.log("Login failed or was cancelled");
    }
  };

  const handleLogout = () => {
    apiStore.logout();
    goto("/");
  };
</script>

<div class="flex flex-col items-center w-[600px] shrink-0">
  <!-- Logo and Subtitle Frame -->
  <div class="relative w-[600px] h-[327px] mb-8">
    <!-- Subtitle (overlaps under logo) -->
    <p
      class="absolute left-4/9 top-[210px] -translate-x-1/2 text-center text-[#888] text-[24px] font-medium tracking-[-1.2px] whitespace-nowrap"
    >
      {subtitle}
    </p>

    <!-- Logo Image -->
    <img
      src={landingLogo}
      alt="Achtung Logo"
      class="absolute inset-0 w-full h-full object-cover pointer-events-none"
    />
  </div>

  <!-- Sign In Button -->
  {#if $apiStore.isAuthenticated}
    <SignInButton onClick={handleLogout} label="Logout" />
  {:else}
    <SignInButton onClick={handleLogin} label="Login" />
  {/if}
</div>
