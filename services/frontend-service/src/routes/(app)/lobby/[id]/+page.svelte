<script lang="ts">
	import LobbyGrid from "$lib/components/lobby/LobbyGrid.svelte";
	import PlayerCard from "$lib/components/lobby/PlayerCard.svelte";
	import MatchSettings from "$lib/components/lobby/MatchSettings.svelte";
	import { wsStore } from "$lib/stores/ws";
	import { userStore } from "$lib/stores/user";
	import type { User } from "$lib/types/types";
	import type { GamePhase } from "@ft/game-ws-protocol";
	import { onDestroy } from "svelte";
	import { goto, beforeNavigate, invalidate } from "$app/navigation";
	import { toast } from "svelte-sonner";

	type GameStatus = "pending" | "ready" | "active" | "completed" | "cancelled"; 
	
	let { data } = $props();


	/* ====================================================================== */
	/*                           REST / GAME RECORD                           */
	/* ====================================================================== */

	const gameRecord = $derived(data.gameRecord);

	const userDirectory = $derived.by(() => {
		const map = new Map<string, User>();
		for (const u of gameRecord?.users ?? []) map.set(String(u.id), u);
		return map;
	});


	/* ====================================================================== */
	/*                           WS / LIVE ROOM STATE                         */
	/* ====================================================================== */

	const liveRoomState = $derived($wsStore.latestState);
	const roomPlayerIdsLive = $derived(liveRoomState?.playerIds ?? []);
	const sceneByIdLive = $derived(liveRoomState?.sceneById ?? {});
	const lastRoomClosed = $derived($wsStore.lastRoomClosed);

	const playersInRoom = $derived(
		roomPlayerIdsLive
			.map((id) => userDirectory.get(String(id)))
			.filter(Boolean) as User[]
	);

	$effect(() => {
		const users = gameRecord?.users ?? [];
		for (const u of users) {
			wsStore.setPlayerMeta(String(u.id), {
				name: u.name,
				avatar_url: u.avatar_url,
			});
		}
	});

	let lastJoinedKey: string | null = null;

	function joinLobbySession(lobbyId: string, user: User) {
		console.log("[lobby] joinLobbySession", { lobbyId, userId: user.id });
		wsStore.setPlayerMeta(String(user.id), {
			name: user.name,
			avatar_url: user.avatar_url,
		});

		const player = {
			playerId: String(user.id),
			rating_mu: Number(user.rating_mu ?? 25),
			rating_sigma: Number(user.rating_sigma ?? 8.333),
		};

		wsStore.createOrJoinRoom(lobbyId, 0, player);
		wsStore.updatePlayerScene(lobbyId, player.playerId, "lobby");
	}


	/* ====================================================================== */
	/*                                TRIGGERS                                */
	/* ====================================================================== */

	$effect(() => {
		const lobbyId = data.lobbyId;
		const user = data.user;
		const playerId = String(user.id);

		// Join WS session
		if (!lobbyId) return;
		const shouldEnsure = $wsStore.status !== "open";
		const joinKey = `${lobbyId}:${playerId}:${shouldEnsure ? "ensure" : "open"}`;
		if (lastJoinedKey !== joinKey) {
			lastJoinedKey = joinKey;
			if (shouldEnsure) joinLobbySession(lobbyId, user);
			else if (!liveRoomState) joinLobbySession(lobbyId, user);
		}
	});

	let lastRosterKey = "";
	$effect(() => {
		const ids = roomPlayerIdsLive.map(String).sort();
		const key = ids.join(",");
		if (key === lastRosterKey) return;

		lastRosterKey = key;

		// Don't re-fetch if the lobby is empty (player was kicked/left)
		if (ids.length === 0) return;

		// Re-run the +page.ts load to refresh the game record
		invalidate('app:gameRecord');
	});

	/**
	 * Detect when the current player is kicked (no longer in playerIds)
	 */
	$effect(() => {
		if (didRedirect) return;

		const ids = roomPlayerIdsLive;
		if (ids.length === 0) return; // no state yet

		const userId = String($userStore?.id ?? "");
		if (!userId) return;

		if (!ids.includes(userId)) {
			console.log("[lobby] kicked — player not in playerIds", { userId, ids });
			didRedirect = true;
			wsStore.disconnect();
			toast.info("You were removed from the lobby.");
			goto("/dashboard", { replaceState: true });
		}
	});

	/**
	 * Room closed
	*/
	$effect(() => {
		const lobbyId = data.lobbyId;
		const closed = lastRoomClosed;

		if (!lobbyId || !closed) return;
		if (String(closed.roomId) !== String(lobbyId)) return;

		if (didRedirect) return;
		console.log("[lobby] room closed", { roomId: closed.roomId, reason: closed.reason });
		didRedirect = true;

		wsStore.leaveRoom();
		toast.info(closed.reason || "The lobby was closed.");

		goto("/dashboard", { replaceState: true });
	});

	/**
	 * Determine when to leave lobby.
	 *
	 * `redirectTarget` is a derived value that recomputes whenever the live
	 * phase or backend status changes.  The effect only fires when the
	 * *target itself* changes (null → "/game/..." etc.), which avoids
	 * the old loop where every WS tick re-ran willRedirect().
	 */
	let didRedirect = false;

	const redirectTarget = $derived.by(() => {
		const lobbyId = data.lobbyId;
		if (!lobbyId) return null;

		const livePhase = liveRoomState?.phase ?? null;
		const backendStatus: GameStatus | null =
			(gameRecord?.status as GameStatus | undefined) ?? null;

		if (!livePhase && !backendStatus) return null;
		return redirectTo({ livePhase, backendStatus });
	});

	$effect(() => {
		if (didRedirect) return;
		const target = redirectTarget;
		if (!target) return;

		console.log("[lobby] redirectTarget → navigating to", target);
		didRedirect = true;
		goto(target, { replaceState: true });
	});

	/* ====================================================================== */
	/*                       CLEANUP ON NAVIGATE AWAY                         */
	/* ====================================================================== */

	let didCleanup = false;

	function cleanupLobby() {
		if (didCleanup) return;
		console.log("[lobby] cleanupLobby");
		didCleanup = true;
		wsStore.leaveRoom();
		wsStore.disconnect();
	}

	beforeNavigate(({ to }) => {
		if (didRedirect) return;  // already handled (kicked, room closed, etc.)

		// Don't clean up when transitioning to the game page (legitimate redirect)
		const dest = to?.url?.pathname ?? "";
		if (dest.startsWith("/game/")) return;

		cleanupLobby();
	});

	onDestroy(() => {
		// Safety net for cases beforeNavigate doesn't cover (e.g. full page unload)
		if (!didRedirect) cleanupLobby();
	});


	/* ====================================================================== */
	/*                                HELPERS                                 */
	/* ====================================================================== */

	function redirectTo(opts: {
		livePhase: GamePhase | null;
		backendStatus: GameStatus | null;
	}) {
		const { livePhase, backendStatus } = opts;
		const userId = String($userStore?.id ?? "");

		// Prefer live phase from WS
		if (livePhase) {
			if (livePhase === "lobby") return null;
			if (livePhase === "ready" || livePhase === "running")
				return `/game/${data.lobbyId}?playerId=${userId}`;
			return "/dashboard";
		}

		// Fallback to REST status
		if (backendStatus) {
			if (backendStatus === "pending" || backendStatus === "ready") return null;
			return "/dashboard";
		}
		return null;
	}

</script>


<svelte:head>
	<title>Lobby - ACHTUNG</title>
</svelte:head>

<section class="relative overflow-hidden">
	<!-- Main content -->
	<div class="flex flex-col items-start gap-6 lg:flex-row lg:items-start lg:justify-start">
		<!-- Left Section - Player Slots -->
		<LobbyGrid>
			{#each playersInRoom as player (player.id)}
				<PlayerCard
					{player}
					scene={sceneByIdLive[String(player.id)] ?? "lobby"}
				/>
			{/each}
		</LobbyGrid>

		<!-- Right Section - Match Settings -->
		<div class="w-full lg:w-ranking shrink-0">
				<MatchSettings
				game={gameRecord!}
				playerCount={playersInRoom.length}
				lobbyId={data.lobbyId}
				playerId={String($userStore?.id ?? '')}
				sceneById={sceneByIdLive}
			/>
		</div>
	</div>
</section>
