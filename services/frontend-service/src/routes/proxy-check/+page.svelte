<script lang="ts">
  import { onMount } from "svelte";

  let userStatus: number | null = null;
  let verifyStatus: number | null = null;
  let userBody = "";
  let verifyBody = "";

  const fetchJson = async (url: string) => {
    const response = await fetch(url, { credentials: "include" });
    const text = await response.text();
    return { status: response.status, text };
  };

  onMount(async () => {
    const userResponse = await fetchJson("/api/user");
    userStatus = userResponse.status;
    userBody = userResponse.text;

    const verifyResponse = await fetchJson("/api/verify");
    verifyStatus = verifyResponse.status;
    verifyBody = verifyResponse.text;
  });
</script>

<div class="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-8">
  <div class="max-w-3xl w-full bg-gray-800 rounded-lg shadow p-6 space-y-6">
    <h1 class="text-2xl font-semibold">Proxy Check</h1>

    <div>
      <h2 class="text-lg font-medium">/api/user</h2>
      <p class="text-sm text-gray-300">Status: {userStatus ?? "loading"}</p>
      <pre class="mt-2 bg-gray-900 rounded p-3 text-xs overflow-auto">{userBody}</pre>
    </div>

    <div>
      <h2 class="text-lg font-medium">/api/verify</h2>
      <p class="text-sm text-gray-300">Status: {verifyStatus ?? "loading"}</p>
      <pre class="mt-2 bg-gray-900 rounded p-3 text-xs overflow-auto">{verifyBody}</pre>
    </div>
  </div>
</div>
