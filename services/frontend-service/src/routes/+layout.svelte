<script lang="ts">
  import { Toaster } from "svelte-sonner";
  import "../app.css";
  import { userStore } from "$lib/stores/user";
  import type { LayoutData } from "./$types";
  import type { User } from "$lib/types/types";

  let {
    data,
    children,
  }: { data: LayoutData & { user: User | null }; children: any } = $props();
  $effect(() => {
    userStore.set(data.user);
  });
</script>

<svelte:head>
  <title>ACHTUNG!</title>
</svelte:head>

<Toaster />

<!-- Global app background -->
<div class="relative min-h-screen overflow-hidden bg-[url('/assets/trans_background.webp')] bg-cover bg-center bg-no-repeat container-type-inline-size">

    <!-- App shell -->
  <div class="relative z-10 flex flex-col min-h-screen">
    <main class="flex-1">
      {@render children()}
    </main>
  </div>
</div>
