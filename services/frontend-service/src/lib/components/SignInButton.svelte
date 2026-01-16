<script>
  // export let onClick = () => {};
  let { onClick, label } = $props();
</script>

<button
  onclick={onClick}
  class="bg-white text-black font-bold text-[18px] px-[67px] py-[21px] rounded-xl shadow-button ease-out w-[300px] h-[64px] flex items-center justify-center cursor-pointer"
>
  {label}
</button>
