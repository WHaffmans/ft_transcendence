<script lang="ts">
  import { goto } from "$app/navigation";

  // New Id for GAME
  function newRoomId() {
    return crypto.randomUUID();
  }

  function startGame() {
    goto(`/game/${newRoomId()}`);
  }
</script>

<footer class="absolute bottom-0 left-0 right-0 py-8 text-center">
  <button
    class="px-4 py-2 mb-4 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
    onclick={startGame}
  >
    game
  </button>
  <p class="text-gray-500 text-sm font-medium">
    Privacy Policy • Terms of Service
  </p>
</footer>
