<script lang="ts">
	import ActionButton from '$lib/components/common/ActionButton.svelte';

	interface Props {
		onStartGame?: () => void;
		onLeaveGame?: () => void;
		isHost?: boolean;
	}

	let { onStartGame, onLeaveGame, isHost = false }: Props = $props();

	const handleStartGame = () => {
		if (onStartGame) {
			onStartGame();
		}
	};

	const handleLeaveGame = () => {
		if (onLeaveGame) {
			onLeaveGame();
		}
	};
</script>

<div class="glass h-ranking rounded-2xl w-full flex flex-col">
	<!-- Header -->
	<div class="flex flex-col gap-2.5 px-6 pt-6">
		<p class="text-xs font-bold text-[#888] uppercase">Match Settings</p>
		<div class="h-px w-full bg-white/10"></div>
	</div>

	<!-- Content - Centered Buttons -->
	<div class="flex-1 flex items-center justify-center">
		<div class="flex flex-col gap-6 items-center w-85">

			<!-- IF we want to make a version that allows for a specific host the
			we can uncomment the code below -->
			<!-- Start Game Button - Only visible for host -->
			<!-- {#if isHost} -->
			 	<!-- <ActionButton text="START GAME" variant="primary" onclick={handleStartGame} /> -->
			<!-- {/if} -->

			<!-- Start Game Button -->
			<ActionButton text="START GAME" variant="primary" onclick={handleStartGame} />

			<!-- Leave Game Button -->
			<ActionButton text="LEAVE GAME" variant="destructive" onclick={handleLeaveGame} />
		</div>
	</div>

	<!-- Footer -->
	<div class="flex items-center justify-center pb-6">
		<p class="text-[10px] text-[#444]">Privacy Policy • Terms of Service</p>
	</div>
</div>
