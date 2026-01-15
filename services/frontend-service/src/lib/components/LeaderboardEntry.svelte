<script lang="ts">
  let { player } = $props();
</script>

<div class="flex items-center justify-between px-[30px] py-[5px] w-full">
  <!-- Avatar -->
  <div class="shrink-0 size-[45px]">
    {#if player.avatar_url}
      <img
        src={player.avatar_url || "/default_avatar.png"}
        alt={player.name}
        class="w-full h-full rounded-full object-cover"
      />
    {:else}
      <div
        class="w-full h-full rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-lg"
      >
        {player.name.charAt(0).toUpperCase()}
      </div>
    {/if}
  </div>

  <!-- Username -->
  <p class="shrink-0 font-bold text-white">
    {player.name.trim().length > 15
      ? player.name.slice(0, 12) + "..."
      : player.name}
  </p>

  <!-- ELO Rating -->
  <p
    class="shrink-0 font-bold text-[14px] text-[#0f8] text-center whitespace-pre"
  >
    {player.rating}
  </p>
</div>
