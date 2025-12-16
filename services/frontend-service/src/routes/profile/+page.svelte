<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import type { User } from "../../lib/types/types";

  let user: User | null = null;
  const checkHealth = async () => {
    const response = await fetch("/auth/api/user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });
    if (!response.ok) {
      throw new Error("Health check failed");
    }
    return await response.json();
  };

  if (browser) {
    onMount(async () => {
      try {
        const data = await checkHealth();
        console.log(data);
        user = data;
      } catch (error) {
        user = null;
      }
    });
  }
</script>

<div
  class="min-h-screen flex flex-col bg-gray-900 text-white justify-center items-center"
>
  <p>Profile!</p>
  <p>Currently logged in under: {user?.name} - {user?.email}</p>
</div>
