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
    } else {
      console.log("Login failed or was cancelled");
    }
  };

  const handleLogout = () => {
    apiStore.logout();
    goto("/");
  };
</script>

<section class="flex flex-col items-center w-150 shrink-0">
  <!-- Logo and Subtitle Frame -->
  <header class="relative w-150 h-81.75 mb-8">
    <!-- Logo Image -->
    <img  src={landingLogo}
          alt="Achtung Logo"
          class="absolute inset-0 object-cover w-full h-full pointer-events-none" />
          
    <!-- Subtitle (overlaps under logo) -->
    <p class="absolute left-4/9 top-19/30 -translate-x-1/2 text-center text-[#888] text-[24px] font-medium tracking-[-1.2px] whitespace-nowrap">
      {subtitle}
    </p>
  </header>

  <!-- Primary call to action -->
     {#if $apiStore.isAuthenticated}
       <SignInButton onClick={handleLogout} label="Logout" />
     {:else}
       <SignInButton onClick={handleLogin} label="Login" />
     {/if}
</section>
