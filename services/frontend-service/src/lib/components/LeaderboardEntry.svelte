<script lang="ts">
  let { player } = $props();
</script>

<!-- Item layout -->
<div class="grid grid-cols-[auto_1fr_auto] items-center w-full min-w-0 px-4 py-2">
  <!-- Avatar -->
  <div class="shrink-0 size-11">
    {#if player.avatar_url}
      <img
        src={player.avatar_url || "/default_avatar.png"}
        alt={player.name}
        class="object-cover w-full h-full rounded-full"
      />
    {:else}
      <div
        class="flex items-center justify-center w-full h-full text-lg font-bold text-white bg-gray-600 rounded-full"
      >
        {player.name.charAt(0).toUpperCase()}
      </div>
    {/if}
  </div>

  <!-- Username -->
  <p class="max-w-full px-4 mx-auto font-bold text-center text-white truncate">
    {player.name}
  </p>

  <!-- ELO Rating -->
  <span class="ml-4 text-sm font-bold text-green-400 shrink-0">
    {player.rating}
  </span>
</div>
