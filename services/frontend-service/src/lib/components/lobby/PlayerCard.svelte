<script lang="ts">
	import { userStore } from "$lib/stores/user";
	import type { User } from "$lib/types/types";

	interface Props {
		player: User;
		scene: "lobby" | "game";
		isHost: boolean;
	}

	let { player, scene, isHost }: Props = $props();

	const isYou = $derived(() => String(player.id) === String($userStore?.id));

	// Styling based on *status only*
	const styling = $derived(() => {
		if (scene === "game") {
			return {
				borderColor: "border-white/50",
				badgeBg: "bg-white",
				badgeText: "text-black text-xs",
				statusLabel: "IN GAME",
			};
		}

		return {
			borderColor: "border-white/20",
			badgeBg: "bg-black/30",
			badgeText: "text-white text-xs",
			statusLabel: "IN LOBBY",
		};
	});

	const hostBorder = $derived(() =>
		isHost ? "border-[rgba(0,255,136,0.5)]" : styling().borderColor
	);
</script>

<div
	class="backdrop-blur-[10px] bg-black/40 border {hostBorder()} rounded-2xl h-70 w-full relative flex items-center justify-center"
>
	<!-- Rank Badge (top left) -->
	<div class="absolute top-2.75 left-2.75 bg-black/20 rounded h-5 px-2 flex items-center">
		<p class="text-[10px] font-bold text-[#888]">{player.rating}</p>
	</div>

	<!-- Labels (top right) -->
	<div class="absolute top-2.75 right-2.75 flex gap-2">
		{#if isHost}
			<div class="bg-[#0f8] rounded-[10px] h-5 px-2 flex items-center justify-center">
				<p class="text-[10px] font-bold text-black">HOST</p>
			</div>
		{/if}

		{#if isYou()}
			<div class="bg-[#3b82f6] rounded-[10px] h-5 px-2 flex items-center justify-center">
				<p class="text-[10px] font-bold text-white">YOU</p>
			</div>
		{/if}
	</div>

	<!-- Player Info (centered) -->
	<div class="flex flex-col items-center gap-2">
		<img
			src={player.avatar_url}
			alt={player.name}
			class="w-20 h-20 rounded-full object-cover"
		/>

		<p class="text-2xl font-bold text-white text-center">{player.name}</p>

		<!-- Status Badge (status only) -->
		<div class="{styling().badgeBg} h-6 rounded-xl px-5 flex items-center justify-center">
			<p class="font-bold {styling().badgeText}">{styling().statusLabel}</p>
		</div>
	</div>
</div>
