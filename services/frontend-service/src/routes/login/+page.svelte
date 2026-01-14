<script lang="ts">
  import { apiStore } from "$lib/stores/api";

  const login = () => {
    apiStore.login();
  };
</script>

<div
  class="login-container bg-gray-900 min-h-screen flex items-center justify-center"
>
  <div
    class="login-card flex flex-col items-center bg-gray-800 p-8 rounded-lg shadow-lg"
  >
    <h1 class="title text-white text-4xl font-bold mb-4">Welcome Back</h1>
    <p class="subtitle text-gray-300 mb-6">
      Sign in to continue to your account
    </p>
    <button color="purple" onclick={login} class="login-btn">
      Login with OAuth
    </button>
  </div>
</div>

<style>
</style>
