<script>
  import { goto } from "$app/navigation";
  import { apiStore } from "$lib/stores/api";
  import SignInButton from "./SignInButton.svelte";

  const landingLogo = "/logo.png";
  const subtitle = "The Kurve Web Edition";

  const api = $apiStore;

  console.log(api.isAuthenticated, api.user);

  const handleLogin = () => {
    console.log("Sign in clicked");
    // goto("/login");
    apiStore.login();
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
  {#if api.isAuthenticated}
    <SignInButton onClick={handleLogout} label="Logout" />
  {:else}
    <SignInButton onClick={handleLogin} label="Login" />
  {/if}
</div>
