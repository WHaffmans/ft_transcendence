<script lang="ts">
	import LobbyGrid from "$lib/components/lobby/LobbyGrid.svelte";
	import PlayerCard from "$lib/components/lobby/PlayerCard.svelte";
	import MatchSettings from "$lib/components/lobby/MatchSettings.svelte";
	import { wsStore } from "$lib/stores/ws";
	import type { User } from "$lib/types/types";
	import type { GamePhase } from "@ft/game-ws-protocol";
	import { onDestroy } from "svelte";
	import { goto, beforeNavigate, invalidate } from "$app/navigation";
	import { toast } from "svelte-sonner";
	import { modalStore } from "$lib/components/modal/modal";

	type GameStatus = "pending" | "ready" | "active" | "completed" | "cancelled"; 
	
	let { data } = $props();


	/* ====================================================================== */
	/*                           REST / GAME RECORD                           */
	/* ====================================================================== */

	/**
	 * Reactive game record loaded from page data.
	 */
	const gameRecord = $derived(data.gameRecord);

	/**
	 * User lookup table keyed by uid.
	 * `Map<uid, User>`
	 */
	const userDirectory = $derived.by(() => {
		const map = new Map<string, User>();
		for (const u of gameRecord?.users ?? [])
			map.set(String(u.id), u);
		return (map);
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

	/**
	 * Player Metadata Sync
	 * Keep WebSocket player metadata aligned with the REST-loaded users for this lobby.
	 */
	$effect(() => {
		const users = gameRecord?.users ?? [];
		for (const u of users) {
			wsStore.setPlayerMeta(String(u.id), {
				name: u.name,
				avatar_url: u.avatar_url,
			});
		}
	});

	/* ====================================================================== */
	/*                          FIRST-TIME ONBOARDING                         */
	/* ====================================================================== */

	let onboardingShown = false;

	$effect(() => {
		if (!onboardingShown && data.completedGames === 0) {
			onboardingShown = true;
			modalStore.open('onboarding');
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
	/*                                CLEANUP                                 */
	/* ====================================================================== */

	let didCleanup = false;
	let isClientNavigation = false;

	function cleanupLobby() {
		if (didCleanup) return;
		console.log("[lobby] cleanupLobby");
		didCleanup = true;
		wsStore.leaveRoom();
		wsStore.disconnect();
	}


	/* ====================================================================== */
	/*                                TRIGGERS                                */
	/* ====================================================================== */

	/**
	 * Lobby Session Join
	 * Join the lobby WebSocket session once for the current lobby and authenticated user.
	 */
	$effect(() => {
		if (didCleanup) return;

		const lobbyId = data.lobbyId;
		const user = data.user;
		const playerId = String(user.id);

		if (!lobbyId) return;

		const isSameBinding =
			$wsStore.roomId === lobbyId &&
			$wsStore.playerId === playerId;

		const isOpenForThisLobby =
			isSameBinding && $wsStore.status === "open";

		if (isOpenForThisLobby) return;

		// Join WS Session
		const joinKey = `${lobbyId}:${playerId}`;
		if (lastJoinedKey === joinKey) return;

		lastJoinedKey = joinKey;
		joinLobbySession(lobbyId, user);
	});

	/**
	 * Lobby Roster Refresh
	 * Revalidate the page data when the live room membership changes while still in the lobby phase.
	 */
	let lastRosterKey = "";
	$effect(() => {
		const ids = roomPlayerIdsLive.map(String).sort();
		const key = ids.join(",");
		if (key === lastRosterKey) return;

		lastRosterKey = key;

		// Don't re-fetch if the lobby is empty (player was kicked/left)
		if (ids.length === 0) return;

		// Don't re-fetch if we're leaving the lobby (phase changed to ready/running).
		// invalidate() would start an async load that blocks goto() navigation.
		const phase = liveRoomState?.phase ?? null;
		if (phase && phase !== "lobby") return;

		// Re-run the +page.ts load to refresh the game record
		invalidate('app:gameRecord');
	});

	/**
	 * Room closed
	 * Handle a server-side room closure for this lobby by notifying the user and redirecting away.
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

	/**
	 * Lobby Redirect
	 * Navigate away from the lobby once the derived live/backend state produces a redirect target.
	 */
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

	beforeNavigate(({ to }) => {
		// `to` is null when leaving the app (refresh, close tab, external link).
		// In that case let the socket die naturally — onPlayerSocketLost on the
		// game-service keeps the player in the room for reconnection.
		if (!to) return;

		isClientNavigation = true;

		if (didRedirect) return;  // already handled (kicked, room closed, etc.)

		// Don't clean up when transitioning to the game page (legitimate redirect)
		const dest = to.url?.pathname ?? "";
		if (dest.startsWith("/game/")) return;

		cleanupLobby();
	});

	onDestroy(() => {
		// Only clean up during SvelteKit client navigations.
		// On full page reload the socket dies naturally and onPlayerSocketLost
		// on the game-service keeps the player in the room for reconnection.
		if (!didRedirect && isClientNavigation) cleanupLobby();
	});


	/* ====================================================================== */
	/*                                HELPERS                                 */
	/* ====================================================================== */

	function redirectTo(opts: {
		livePhase: GamePhase | null;
		backendStatus: GameStatus | null;
	}) {
		const { livePhase, backendStatus } = opts;
		const userId = String(data.user.id);

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
				playerId={String(data.user.id)}
				sceneById={sceneByIdLive}
				onLeave={() => {
					cleanupLobby();
					goto('/dashboard', { replaceState: true });
				}}
			/>
		</div>
	</div>
</section>
