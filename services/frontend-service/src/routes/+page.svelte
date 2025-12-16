<script lang="ts">
  import type { PageProps } from "./$types";
  import { Button, Listgroup, ListgroupItem } from "flowbite-svelte";

  let counter = $state(0);
  let { data }: PageProps = $props();

  function increment() {
    counter += 1;
  }
</script>

<div
  class="flex flex-col items-center justify-center p-7 bg-gray-950 min-h-screen text-white"
>
  <h1 class="text-2xl mb-5 justify-self-start font-bold">FT_Transcendence</h1>
  <Listgroup class="max-w-1/4 mb-5">
    {#each data.users as item}
      <ListgroupItem class=" bg-amber-950  transition-all hover:translate-x-3"
        ><span class="text-amber-200 font-bold">{item.username}</span
        ></ListgroupItem
      >
    {/each}
  </Listgroup>
  <Button onclick={increment}>{counter}</Button>
</div>
