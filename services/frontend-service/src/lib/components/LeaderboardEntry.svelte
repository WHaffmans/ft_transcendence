<script>
  export let player;
</script>

<div class="flex items-center justify-between px-[30px] py-[5px] w-full">
  <!-- Avatar -->
  <div class="shrink-0 size-[45px]">
    <img
      src={player.avatar}
      alt={player.username}
      class="w-full h-full rounded-full object-cover"
    />
  </div>

  <!-- Username -->
  <p class="shrink-0 font-bold text-[18px] text-white text-center">
    {player.username}
  </p>

  <!-- ELO Rating -->
  <p class="shrink-0 font-bold text-[14px] text-[#0f8] text-center whitespace-pre">
    {player.elo} ELO
  </p>
</div>
