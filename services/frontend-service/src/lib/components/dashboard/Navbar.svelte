<script lang="ts">
  interface Props {
    username: string;
    avatar: string;
    onLogout?: () => void;
    onOpenSettings?: () => void;
  }

  let { username, avatar, onLogout, onOpenSettings }: Props = $props();

  const handleLogoutClick = () => {
    onLogout?.();
  };

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
      <!-- Settings -->
      <button
        onclick={handleOpenSettingsClick}
        class="w-5 h-5 text-white transition-colors hover:text-white/40"
        aria-label="Settings"
      >
        <img
          src="/assets/settings-icon.svg"
          alt=""
          class="w-full h-full"
        />
      </button>

      <!-- Username -->
      <p class="text-sm font-bold text-white">
        {username}
      </p>

      <!-- Avatar -->
      <img
        src={avatar}
        alt={username}
        class="object-cover rounded-full h-9 w-9"
      />

      <!-- Logout -->
      <button
        onclick={handleLogoutClick}
        class="ml-2 text-[11px] font-bold text-[#f36] transition-colors hover:text-[#ff4466]"
      >
        LOGOUT
      </button>
    </div>
  </div>
</nav>
