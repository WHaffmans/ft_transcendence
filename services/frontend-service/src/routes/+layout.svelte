<script lang="ts">
  import "./layout.css";
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import {
    Navbar,
    NavBrand,
    NavHamburger,
    NavUl,
    NavLi,
    Button,
    Avatar,
    Dropdown,
    DropdownHeader,
    DropdownItem,
    DropdownDivider,
  } from "flowbite-svelte";
  import { ChevronDownOutline } from "flowbite-svelte-icons";
  import { auth } from "$lib/stores/auth";

  let { children } = $props();

  onMount(() => {
    if (!browser) return;
    auth.fetchUser();

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "LOGIN_SUCCESS") {
        auth.fetchUser(); // Refresh user data instead of reloading
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<header>
  <Navbar class="bg-gray-800 border-gray-700">
    <NavBrand href="/">
      <span
        class="self-center whitespace-nowrap text-xl font-semibold text-white"
      >
        ft_transcendence
      </span>
    </NavBrand>
    <NavHamburger />
    <NavUl class="md:flex md:items-center lg:items-center justify-center">
      <NavLi>
        {#if $auth.loading}
          <div class="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
        {:else if $auth.user}
          <button
            class="flex items-center gap-2 text-gray-300 hover:text-white"
          >
            <Avatar
              size="sm"
              class="cursor-pointer"
              src={$auth.user.avatar || ""}
              alt={$auth.user.name}
            />
            <span class="hidden md:inline">{$auth.user.name}</span>
            <ChevronDownOutline class="w-4 h-4" />
          </button>
          <Dropdown class="w-48 bg-gray-700 border-gray-600">
            <DropdownHeader>
              <span class="block text-sm text-white">{$auth.user.name}</span>
              <span class="block truncate text-sm font-medium text-gray-400"
                >{$auth.user.email}</span
              >
            </DropdownHeader>
            <DropdownItem
              href="/profile"
              class="text-gray-300 hover:bg-gray-600 hover:text-white"
            >
              My Profile
            </DropdownItem>
            <DropdownItem
              class="text-gray-300 hover:bg-gray-600 hover:text-white"
            >
              Settings
            </DropdownItem>
            <DropdownItem
              onclick={auth.logout}
              class="text-red-400 hover:bg-gray-600 hover:text-red-300"
            >
              Sign out
            </DropdownItem>
          </Dropdown>
        {:else}
          <Button onclick={auth.login} size="sm" color="purple">Login</Button>
        {/if}
      </NavLi>
    </NavUl>
  </Navbar>
</header>

{@render children()}
