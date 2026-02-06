<script lang="ts">
	import LobbyGrid from "$lib/components/lobby/LobbyGrid.svelte";
	import PlayerCard from "$lib/components/lobby/PlayerCard.svelte";
	import MatchSettings from "$lib/components/lobby/MatchSettings.svelte";
	import { wsStore } from "$lib/stores/ws";
	import { userStore } from "$lib/stores/user";
	import type { Game, User } from "$lib/types/types";
	import { goto } from "$app/navigation";

	let { data } = $props();


	/* ====================================================================== */
	/*                           REST / GAME RECORD                           */
	/* ====================================================================== */

	let gameRecord = $state<Game | null>(null);
	let lastLoadedLobbyId: string | null = null;

	async function loadGameRecord(lobbyId: string) {
		try {
			const res = await fetch(`/api/games/${lobbyId}`, {
				method: "GET",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			gameRecord = await res.json();
		} catch (err) {
			console.error("loadGameRecord failed:", err);
		}
	}

	const userDirectory = $derived(() => {
		const map = new Map<string, User>();
		for (const u of gameRecord?.users ?? []) map.set(String(u.id), u);
		return map;
	});


	/* ====================================================================== */
	/*                           WS / LIVE ROOM STATE                         */
	/* ====================================================================== */

	const liveRoomState = $derived(() => $wsStore.latestState);
	const roomPlayerIdsLive = $derived(() => liveRoomState()?.playerIds ?? []);
	const sceneByIdLive = $derived(() => liveRoomState()?.sceneById ?? {});
	const hostIdLive = $derived(() => liveRoomState()?.hostId ?? null);

	const playersInRoom = $derived(() =>
		roomPlayerIdsLive()
			.map((id) => userDirectory().get(String(id)))
			.filter(Boolean) as User[]
	);

	let lastJoinedKey: string | null = null;

	function joinLobbySession(lobbyId: string, playerId: string) {
		const seed = gameRecord?.seed ?? 0;
		wsStore.createOrJoinRoom(lobbyId, seed, playerId);
		wsStore.updatePlayerScene(lobbyId, playerId, "lobby");
	}


	/* ====================================================================== */
	/*                                TRIGGERS                                */
	/* ====================================================================== */

	$effect(() => {
		const lobbyId = data.lobbyId;
		const playerId = $userStore?.id ? String($userStore.id) : null;

		// 1. Auth guard
		if (!playerId) {
			goto("/dashboard", { replaceState: true });
			return;
		}

		// 2. Load REST record once per lobbyId
		if (lobbyId && lastLoadedLobbyId !== lobbyId) {
			lastLoadedLobbyId = lobbyId;
			loadGameRecord(lobbyId);
		}

		// 3. Join WS session
		if (!lobbyId) return;
		const joinKey = `${lobbyId}:${playerId}`;
		if (lastJoinedKey !== joinKey) {
			lastJoinedKey = joinKey;
			joinLobbySession(lobbyId, playerId);
		}
	});

	let lastRosterKey = "";
	$effect(() => {
		const lobbyId = data.lobbyId;
		if (!lobbyId) return;

		const ids = roomPlayerIdsLive().map(String).sort();
		const key = ids.join(",");
		if (key === lastRosterKey) return;

		lastRosterKey = key;
		loadGameRecord(lobbyId);
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
					scene={sceneByIdLive()[String(player.id)] ?? "lobby"}
					isHost={String(player.id) === String(hostIdLive())}
				/>
			{/each}
		</LobbyGrid>

		<!-- Right Section - Match Settings -->
		<div class="w-full lg:w-ranking shrink-0">
			<MatchSettings
				isHost={String($userStore?.id) === String(hostIdLive())}
				game={gameRecord!}
			/>
		</div>
	</div>
</section>
