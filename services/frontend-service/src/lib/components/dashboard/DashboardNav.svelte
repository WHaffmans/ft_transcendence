<script lang="ts">
	interface Props {
		username: string;
		avatar: string;
		onLogout?: () => void;
	}

	let { username, avatar, onLogout }: Props = $props();

	const handleLogoutClick = () => {
		if (onLogout) {
			onLogout();
		}
	};
</script>

<nav class="fixed top-0 left-0 right-0 z-50 h-16 backdrop-blur-[10px] bg-black/50">
	<!-- Border bottom -->
	<div class="absolute bottom-0 left-0 right-0 h-px bg-white/10"></div>

	<div class="flex items-center justify-between h-full px-6">
		<!-- Logo -->
		<h1 class="text-xl font-bold text-white tracking-[-1px]">ACHTUNG</h1>

		<!-- User Panel -->
		<div class="flex items-center gap-3">
			<!-- Settings Icon -->
			<button
				class="w-5 h-5 text-white hover:text-white/80 transition-colors"
				aria-label="Settings"
			>
				<img src="/assets/settings-icon.svg" alt="" class="w-full h-full" />
			</button>

			<!-- Username -->
			<p class="text-sm font-bold text-white">
				{username}
			</p>

			<!-- Avatar -->
			<img
				src={avatar}
				alt={username}
				class="w-9 h-9 rounded-full object-cover"
			/>

			<!-- Logout Button -->
			<button
				onclick={handleLogoutClick}
				class="text-[11px] font-bold text-[#f36] hover:text-[#ff4466] transition-colors ml-2"
			>
				LOGOUT
			</button>
		</div>
	</div>
</nav>
