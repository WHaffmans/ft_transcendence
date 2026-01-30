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

<div class="flex items-center justify-center min-h-screen p-8 text-gray-100 bg-gray-900">
  <div class="w-full max-w-3xl p-6 space-y-6 bg-gray-800 rounded-lg shadow">
    <h1 class="text-2xl font-semibold">Proxy Check</h1>

    <div>
      <h2 class="text-lg font-medium">/api/user</h2>
      <p class="text-sm text-gray-300">Status: {userStatus ?? "loading"}</p>
      <pre class="p-3 mt-2 overflow-auto text-xs bg-gray-900 rounded">{userBody}</pre>
    </div>

    <div>
      <h2 class="text-lg font-medium">/api/verify</h2>
      <p class="text-sm text-gray-300">Status: {verifyStatus ?? "loading"}</p>
      <pre class="p-3 mt-2 overflow-auto text-xs bg-gray-900 rounded">{verifyBody}</pre>
    </div>
  </div>
</div>
