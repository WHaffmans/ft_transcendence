<script lang="ts">
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
  import type { User } from "$lib/types/types";

  let user: User | null = $state(null);
  let isLoading = $state(true);

  const fetchUser = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      isLoading = false;
      return;
    }

    try {
      const response = await fetch("/auth/api/user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        user = await response.json();
      } else {
        // Token invalid, clear it
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        user = null;
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      user = null;
    } finally {
      isLoading = false;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    user = null;
    window.location.href = "/frontend";
  };

  if (browser) {
    onMount(() => {
      fetchUser();
    });
  }
</script>

<header>
  <Navbar class="bg-gray-800 border-gray-700">
    <NavBrand href="/frontend">
      <span
        class="self-center whitespace-nowrap text-xl font-semibold text-white"
      >
        ft_transcendence
      </span>
    </NavBrand>
    <NavHamburger />
    <NavUl class="md:flex md:items-center lg:items-center justify-center">
      <!-- <NavLi href="/svelte" class="text-gray-300 hover:text-white">Home</NavLi> -->
      <!-- <NavLi href="/svelte/profile" class="text-gray-300 hover:text-white"
        >Profile</NavLi
      > -->
      <NavLi>
        {#if isLoading}
          <div class="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
        {:else if user}
          <button
            class="flex items-center gap-2 text-gray-300 hover:text-white"
          >
            <Avatar size="sm" class="cursor-pointer"
              >{user.name?.charAt(0).toUpperCase() ?? "U"}</Avatar
            >
            <span class="hidden md:inline">{user.name}</span>
            <ChevronDownOutline class="w-4 h-4" />
          </button>
          <Dropdown class="w-48 bg-gray-700 border-gray-600">
            <DropdownHeader>
              <span class="block text-sm text-white">{user.name}</span>
              <span class="block truncate text-sm font-medium text-gray-400"
                >{user.email}</span
              >
            </DropdownHeader>
            <DropdownItem
              href="/frontend/profile"
              class="text-gray-300 hover:bg-gray-600 hover:text-white"
            >
              My Profile
            </DropdownItem>
            <DropdownItem
              class="text-gray-300 hover:bg-gray-600 hover:text-white"
            >
              Settings
            </DropdownItem>
            <DropdownDivider class="border-gray-600" />
            <DropdownItem
              onclick={logout}
              class="text-red-400 hover:bg-gray-600 hover:text-red-300"
            >
              Sign out
            </DropdownItem>
          </Dropdown>
        {:else}
          <Button href="/frontend/login" size="sm" color="purple">Login</Button>
        {/if}
      </NavLi>
    </NavUl>
  </Navbar>
</header>

<section class="min-h-svh bg-gray-900 flex items-center justify-center">
  <h1 class="text-4xl text-white">Welcome to Flowbite-Svelte!</h1>
</section>
