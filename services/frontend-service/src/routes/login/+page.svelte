<script lang="ts">
  import { Button } from "flowbite-svelte";
  import { sha256 } from "js-sha256";
  import { PUBLIC_CLIENT_ID, PUBLIC_DOMAIN } from "$env/static/public";

  const rString = (length: number) => {
    let result = "";
    let characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  // Base64-url encode
  function base64(str: string) {
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  // Convert array to string for base64 encoding
  function arrayToString(array: number[]) {
    return String.fromCharCode(...array);
  }

  const login = async () => {
    let client_id = "019b2d20-ce15-7335-828a-b184b656c035";
    let redirect_uri = encodeURIComponent(`http://${PUBLIC_DOMAIN}/frontend/callback`);
    let state = rString(40);
    sessionStorage.setItem("pkce_state", state);

    let code_verifier = rString(128);
    sessionStorage.setItem("pkce_code_verifier", code_verifier);

    let code_challenge = base64(
      arrayToString(sha256.create().update(code_verifier).array())
    );

    let response_type = "code";
    let scope = encodeURIComponent("user:read");
    let auth_url = `http://${PUBLIC_DOMAIN}/auth/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=${response_type}&scope=${scope}&state=${state}&code_challenge=${code_challenge}&code_challenge_method=S256`;
    window.location.href = auth_url;
  };
</script>

<div class="login-container bg-gray-900 min-h-screen flex items-center justify-center">
  <div class="login-card flex flex-col items-center bg-gray-800 p-8 rounded-lg shadow-lg">
    <h1 class="title text-white text-4xl font-bold mb-4">Welcome Back</h1>
    <p class="subtitle text-gray-300 mb-6">Sign in to continue to your account</p>
    <Button color="purple" onclick={login} class="login-btn">
      Login with OAuth
    </Button>
  </div>
</div>

<style>

</style>
