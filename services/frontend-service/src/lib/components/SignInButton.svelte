<script>
  export let onClick = () => {};
</script>

<button
  on:click={onClick}
  class="bg-white text-black font-bold text-[18px] px-[67px] py-[21px] rounded-xl shadow-glow hover:shadow-glow-strong hover:-translate-y-1 active:translate-y-0 active:shadow-glow transition-all duration-150 ease-out w-[300px] h-[64px] flex items-center justify-center cursor-pointer"
>
  Sign In
</button>
