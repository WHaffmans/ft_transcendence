<script lang="ts">
  import { userStore } from '$lib/stores/user';

  interface Props {
    onOpenSettings?: () => void;
  }

  let { onOpenSettings }: Props = $props();

  const username = $derived($userStore?.name ?? 'Guest');
  const avatar = $derived($userStore?.avatar_url ?? '');

  const handleOpenSettingsClick = () => {
    onOpenSettings?.();
  };
</script>

<nav class="fixed top-0 left-0 right-0 z-50 h-16 bg-black/50 backdrop-blur-[10px]">
  <!-- Border bottom -->
  <div class="absolute bottom-0 left-0 right-0 h-px bg-white/10"></div>

  <div class="flex items-center justify-between h-full px-6">
    <!-- Logo -->
    <h1 class="text-xl font-bold tracking-[-1px] text-white">
      ACHTUNG
    </h1>

    <!-- User Panel -->
    <div class="flex items-center gap-3">
      <!-- Username & Avatar (opens settings) -->
      <button
        onclick={handleOpenSettingsClick}
        class="flex items-center gap-3 transition-opacity duration-100 hover:opacity-70"
        aria-label="Open settings"
      >
        <p class="text-sm font-bold text-white">
          {username}
        </p>
        <img
          src={avatar || '/placeholders/avatars/avatar_placeholder.webp'}
          alt={username}
          class="object-cover rounded-full h-9 w-9"
        />
      </button>
    </div>
  </div>
</nav>
