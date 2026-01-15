<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";

  let isProcessing = true;
  let error = "";

  onMount(async () => {
    const urlParams = $page.url.searchParams;
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const error = urlParams.get("error");
    if (window.opener && window.opener !== window) {
      if (error) {
        // Send error to parent window
        window.opener.postMessage(
          {
            type: "OAUTH_ERROR",
            error: error,
          },
          window.location.origin
        );
      } else if (code && state) {
        // Send success to parent window
        window.opener.postMessage(
          {
            type: "OAUTH_SUCCESS",
            code: code,
            state: state,
          },
          window.location.origin
        );
      }
      window.close();
    } else {
      goto("/", { replaceState: true });
    }
  });
</script>

<div class="min-h-screen bg-gray-900 flex items-center justify-center">
  <div class="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
    {#if isProcessing}
      <div class="flex flex-col items-center">
        <div
          class="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"
        ></div>
        <h2 class="text-white text-xl font-semibold mb-2">
          Processing login...
        </h2>
        <p class="text-gray-300">
          Please wait while we complete your authentication.
        </p>
      </div>
    {:else if error}
      <div class="flex flex-col items-center">
        <div
          class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-4"
        >
          <svg
            class="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </div>
        <h2 class="text-white text-xl font-semibold mb-2">Login Failed</h2>
        <p class="text-gray-300 mb-4">{error}</p>
        <a
          href="/login"
          class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
        >
          Try Again
        </a>
      </div>
    {/if}
  </div>
</div>
