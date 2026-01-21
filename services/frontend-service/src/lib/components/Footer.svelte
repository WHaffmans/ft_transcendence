<script lang="ts">
  import { goto } from "$app/navigation";
  import { apiStore } from "$lib/stores/api";

  const findGame = () => {
    if (!$apiStore.isAuthenticated) {
      alert("You must be logged in to find a game.");
      return;
    }
    apiStore.fetchApi("/games/find").then((data) => {
      console.log("Game found:", data);
      goto(`/lobby/${data.id}`);
    }).catch((error) => {
      console.error("Error finding game:", error);
    });
  };
</script>

<footer class="absolute bottom-0 left-0 right-0 py-8 text-center">
  <button
    class="px-4 py-2 mb-4 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
    onclick={findGame}
  >
    game
  </button>
  <p class="text-gray-500 text-sm font-medium">
    Privacy Policy • Terms of Service
  </p>
</footer>
