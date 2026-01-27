<script>
  let { onClick, label } = $props();
</script>

<button
  onclick={onClick}
  class="bg-white text-black font-bold text-[18px] px-16.75 py-5.25 rounded-xl shadow-button ease-out w-75 h-16 flex items-center justify-center cursor-pointer"
>
  {label}
</button>
