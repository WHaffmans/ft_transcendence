<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { sha256 } from "js-sha256";
  import {
    PUBLIC_CLIENT_ID,
    PUBLIC_DOMAIN,
    PUBLIC_OAUTH_REDIRECT_URI,
  } from "$env/static/public";
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
  import { arrayToString, base64, randomString } from "../lib/utils";

  let user: User | null = $state(null);
  let isLoading = $state(true);

  const login = async () => {
    let client_id = `${PUBLIC_CLIENT_ID}`;
    let redirect_uri = encodeURIComponent(`${PUBLIC_OAUTH_REDIRECT_URI}`);
    let state = randomString(40);
    localStorage.setItem("pkce_state", state);

    let code_verifier = randomString(128);
    localStorage.setItem("pkce_code_verifier", code_verifier);

    let code_challenge = base64(
      arrayToString(sha256.create().update(code_verifier).array())
    );

    let response_type = "code";
    let scope = encodeURIComponent("user:read");
    let auth_url = `http://${PUBLIC_DOMAIN}/auth/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=${response_type}&scope=${scope}&state=${state}&code_challenge=${code_challenge}&code_challenge_method=S256`;

    const width = 600;
    const height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    window.open(
      auth_url,
      "oauth-popup",
      `width=${width},height=${height},top=${top},left=${left}`
    );
  };

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
    fetch("/auth/api/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    })
      .then(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        user = null;
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      });
  };

  onMount(() => {
    if (!browser) return;
    fetchUser();

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "LOGIN_SUCCESS") {
        fetchUser(); // Refresh user data instead of reloading
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  });
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
              onclick={logout}
              class="text-red-400 hover:bg-gray-600 hover:text-red-300"
            >
              Sign out
            </DropdownItem>
          </Dropdown>
        {:else}
          <Button onclick={login} size="sm" color="purple">Login</Button>
        {/if}
      </NavLi>
    </NavUl>
  </Navbar>
</header>


<section class="min-h-svh bg-gray-900 flex items-center justify-center">
  <h1 class="text-4xl text-white">Welcome to Flowbite-Svelte!</h1>
</section>
