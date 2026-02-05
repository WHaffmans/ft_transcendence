<script lang="ts">
	import LobbyGrid from "$lib/components/lobby/LobbyGrid.svelte";
	import PlayerCard from "$lib/components/lobby/PlayerCard.svelte";
	import MatchSettings from "$lib/components/lobby/MatchSettings.svelte";
	import { wsStore } from "$lib/stores/ws.js";
	import { userStore } from "$lib/stores/user.js";
	import type { Game } from "$lib/types/types.js";
	import type { User } from "$lib/types/types.js";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";

	let { data } = $props();
	let game = $state(null as Game | null);
	let joined = $state(false);
	const userId = $derived(() => $userStore?.id);

	const usersById = $derived(() => {
		const m = new Map<string, User>();
		for (const u of game?.users ?? [])
			m.set(String(u.id), u);
		return m;
	});

	const roomPlayerIds = $derived(() => $wsStore.latestState?.playerIds ?? []);
	const sceneById = $derived(() => $wsStore.latestState?.sceneById ?? {});
	const hostId = $derived(() => $wsStore.latestState?.hostId ?? null);

	const playersInRoom = $derived(() => {
		return roomPlayerIds()
			.map((id) => usersById().get(String(id)))
			.filter(Boolean) as User[];
	});

	$effect(() => {

		console.log("latestState", $wsStore.latestState);
		console.log("roomPlayerIds", roomPlayerIds());
		console.log("playersInRoom", playersInRoom);

		const last = $wsStore.messages?.[$wsStore.messages.length - 1];
		const type = last?.type;

		if (type === "joined" || type === "left") {
			console.log("Lobby detected join/leave, refetching game data.");
			fetchGameData();
		}
	});

	async function fetchGameData() {
		try {
			const response = await fetch(`/api/games/${data.lobbyId}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			});
			const gameData = await response.json();
			console.log("Fetched game data:", gameData);
			game = gameData;

			if (!joined) {
				createOrJoinRoom();
				joined = true;
			}
		} catch (err) {
			console.error("Error fetching game data:", err);
		}
	}

	function createOrJoinRoom() {
		if (!game) {
			console.log("ERROR: joinGame() - No game object");
			return;
		}

		const playerId = userId();
		if (playerId == null) {
			console.log("ERROR: joinGame() - player ID null");
			return;
		}

		wsStore.createOrJoinRoom(data.lobbyId, 1, String(playerId));
		wsStore.updatePlayerScene(data.lobbyId, String(playerId), "lobby");
	}

	onMount(() => {
		if (!userId()) {
			console.log("ERROR: onMount() - user ID null");
			goto("/dashboard", { replaceState: true });
			return;
		}
		wsStore.connect();
		fetchGameData();
	});
</script>

<svelte:head>
	<title>Lobby - ACHTUNG</title>
</svelte:head>

<section class="relative overflow-hidden">
	<!-- Main content -->
	<div class="flex flex-col items-start justify-between gap-6 lg:flex-row">
		<!-- Left Section - Player Slots -->
		<LobbyGrid>
			{#each playersInRoom() as player (player.id)}
				<PlayerCard
					{player}
					scene={sceneById()[String(player.id)] ?? "lobby"}
					isHost={String(player.id) === String(hostId())}
				/>
			{/each}
		</LobbyGrid>

		<!-- Right Section - Match Settings -->
		<div class="w-full lg:w-ranking shrink-0">
			<MatchSettings isHost={false} game={game!} />
		</div>
	</div>
</section>
