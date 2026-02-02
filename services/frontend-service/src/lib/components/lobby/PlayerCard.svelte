<script lang="ts">
  import { userStore } from "$lib/stores/user";
  import type { User } from "$lib/types/types";

  interface Props {
    player: User;
  }

  let { player }: Props = $props();

  // Get styling based on player status
  const styling = $derived(() => {
    // switch (player.status) {
    // 	case 'host':
    // 		return {
    // 			borderColor: 'border-[rgba(0,255,136,0.5)]',
    // 			badgeBg: 'bg-[#0f8]',
    // 			badgeText: 'text-black text-xs',
    // 			statusLabel: 'HOST'
    // 		};
    // 	case 'ready':
    		return {
    			borderColor: 'border-white/50',
    			badgeBg: 'bg-white',
    			badgeText: 'text-black text-xs',
    			statusLabel: 'READY'
    		};
    // 	case 'not-ready':
    // return {
    //   borderColor: "border-[rgba(255,51,102,0.5)]",
    //   badgeBg: "bg-[#f36]",
    //   badgeText: "text-white text-[10px]",
    //   statusLabel: "NOT READY",
    // };
    // }
  });
</script>

<div
  class="backdrop-blur-[10px] bg-black/40 border {styling()
    .borderColor} rounded-2xl h-70 w-full relative flex items-center justify-center"
>
  <!-- Rank Badge (top left) -->
  <div
    class="absolute top-2.75 left-2.75 bg-black/20 rounded h-5 px-2 flex items-center"
  >
    <p class="text-[10px] font-bold text-[#888]">
      {player.rating}
    </p>
  </div>

  <!-- YOU Badge (top right) - only shown for current user -->
  {#if player.id ==  $userStore?.id}
    <div
      class="absolute top-2.75 right-2.75 bg-[#3b82f6] rounded-[10px] h-5 w-10 flex items-center justify-center"
    >
      <p class="text-[10px] font-bold text-white">YOU</p>
    </div>
  {/if}

  <!-- Player Info (centered) -->
  <div class="flex flex-col items-center gap-2">
    <!-- Avatar -->
    <img
      src={player.avatar_url}
      alt={player.name}
      class="w-20 h-20 rounded-full object-cover"
    />

    <!-- Username -->
    <p class="text-2xl font-bold text-white text-center">
      {player.name}
    </p>

    <!-- Status Badge -->
    <div
      class="{styling()
        .badgeBg} h-6 rounded-xl px-5 flex items-center justify-center"
    >
      <p class="font-bold {styling().badgeText}">
        {styling().statusLabel}
      </p>
    </div>
  </div>
</div>
