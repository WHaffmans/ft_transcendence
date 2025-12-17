<script lang="ts">
  import { page } from "$app/state";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { PUBLIC_CLIENT_ID, PUBLIC_DOMAIN, PUBLIC_OAUTH_REDIRECT_URI } from "$env/static/public";

  let error = page.url.searchParams.get("error");
  let code = page.url.searchParams.get("code");
  let state = page.url.searchParams.get("state");

  const getToken = async (code: string, code_verifier: string) => {
    try {
      const response = await fetch(`http://${PUBLIC_DOMAIN}/auth/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          code_verifier: code_verifier,
          redirect_uri: `${PUBLIC_OAUTH_REDIRECT_URI}`,
          client_id: `${PUBLIC_CLIENT_ID}`,
        }),
      });
      return await response.json();
    } catch (err) {
      error = "Failed to fetch token.";
    }
  };

  onMount(async () => {
    if (!browser) return;
    let session_state = sessionStorage.getItem("pkce_state");
    let code_verifier = sessionStorage.getItem("pkce_code_verifier");

    if (!code || !state || state !== session_state || !code_verifier) {
      error = "Invalid PKCE parameters.";
      return;
    }
    const tokenResponse = await getToken(code, code_verifier);
    if (tokenResponse && tokenResponse.access_token) {
      console.log("Access Token:", tokenResponse);
      localStorage.setItem("access_token", tokenResponse.access_token);
      localStorage.setItem("refresh_token", tokenResponse.refresh_token);

      window.location.href = `/`;
    } else {
      error = "Failed to retrieve access token.";
    }
    sessionStorage.removeItem("pkce_state");
    sessionStorage.removeItem("pkce_code_verifier");
  });
</script>

<div class="callback-container bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white">
  <h1 class="text-4xl font-bold mb-4"> Loading... </h1>
  <br />
  {#if error}
    <p1 class="text-red-800 font-bold">Error: {error}</p1>
  {:else}
    <p1 class="text-green-600 font-bold">Authentication successful!</p1>
  {/if}
</div>
