<script lang="ts">
	import { userStore } from "$lib/stores/user";
	import type { User } from "$lib/types/types";

	interface Props {
		player: User;
		scene: "lobby" | "game";
	}

	let { player, scene }: Props = $props();

	const isYou = $derived(String(player.id) === String($userStore?.id));

	type PlayerStatus = "ready" | "not-ready";

	const status = $derived<PlayerStatus>(
		scene === "game" ? "ready" : "not-ready"
	);

	const styling = $derived(() => {
		switch (status) {
			case "ready":
				return {
					borderColor: "border-[rgba(0,255,136,0.5)]",
					badgeBg: "bg-[#0f8]",
					badgeText: "text-black text-xs",
					statusLabel: "READY",
				};
			case "not-ready":
				return {
					borderColor: "border-[rgba(255,51,102,0.5)]",
					badgeBg: "bg-[#f36]",
					badgeText: "text-white text-[10px]",
					statusLabel: "NOT READY",
				};
		}
	});
</script>

<div
	class="backdrop-blur-[10px] bg-black/40 border {styling().borderColor} rounded-2xl h-70 w-full relative flex items-center justify-center"
>
	<!-- Rank Badge (top left) -->
	<div class="absolute top-2.75 left-2.75 bg-black/20 rounded h-5 px-2 flex items-center">
		<p class="text-[10px] font-bold text-[#888]">{player.rating}</p>
	</div>

	<!-- Labels (top right) -->
	<div class="absolute top-2.75 right-2.75 flex gap-2">
		{#if isYou}
			<div class="bg-[#3b82f6] rounded-[10px] h-5 px-2 flex items-center justify-center">
				<p class="text-[10px] font-bold text-white">YOU</p>
			</div>
		{/if}
	</div>

	<!-- Player Info (centered) -->
	<div class="flex flex-col items-center gap-2">
		<img
			src={player.avatar_url || '/placeholders/avatars/avatar_placeholder.webp'}
			alt={player.name}
			class="w-20 h-20 rounded-full object-cover"
		/>

		<p class="text-2xl font-bold text-white text-center">{player.name}</p>

		<!-- Status Badge -->
		<div class="{styling().badgeBg} h-6 rounded-xl px-5 flex items-center justify-center">
			<p class="font-bold {styling().badgeText}">{styling().statusLabel}</p>
		</div>
	</div>
</div>
