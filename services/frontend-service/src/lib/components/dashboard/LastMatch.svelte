<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { LastMatchData, LastMatchPlayer } from '$lib/types/types';

	interface Props {
		initialMatch: LastMatchData;
		gameIds: string[];
		userId: number;
	}

	let { initialMatch, gameIds, userId }: Props = $props();

	let currentIndex = $state(0);
	let currentMatch = $state<LastMatchData>({ players: [], date: '' });
	let loading = $state(false);
	const cache = new Map<string, LastMatchData>();

	// Seed cache with the server-rendered first match and sync on prop changes
	$effect(() => {
		if (gameIds.length > 0) {
			cache.set(gameIds[0], initialMatch);
		}
		currentMatch = initialMatch;
		currentIndex = 0;
	});

	let hasPrev = $derived(currentIndex < gameIds.length - 1);
	let hasNext = $derived(currentIndex > 0);
	let direction = $state<'left' | 'right'>('left');

	function buildMatchData(game: any): LastMatchData {
		const players: LastMatchPlayer[] = game.users.map((user: any) => ({
			id: user.id,
			name: user.name,
			rating: Number(user.user_game.rating),
			delta: user.user_game.diff != null ? Number(user.user_game.diff) : null,
			rank: user.user_game.rank,
			isCurrentUser: user.id === userId
		}));
		players.sort((a, b) => a.rank - b.rank);

		const date = new Date(game.updated_at).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});

		return { players, date };
	}

	async function navigate(dir: 'prev' | 'next') {
		const newIndex = dir === 'prev' ? currentIndex + 1 : currentIndex - 1;
		direction = dir === 'prev' ? 'left' : 'right';
		if (newIndex < 0 || newIndex >= gameIds.length) return;

		const gameId = gameIds[newIndex];
		const cached = cache.get(gameId);
		if (cached) {
			currentIndex = newIndex;
			currentMatch = cached;
			return;
		}

		loading = true;
		try {
			const res = await fetch(`/api/games/${gameId}`);
			if (!res.ok) return;
			const game = await res.json();
			const matchData = buildMatchData(game);
			cache.set(gameId, matchData);
			currentIndex = newIndex;
			currentMatch = matchData;
		} catch (err) {
			console.error('Failed to load match:', err);
		} finally {
			loading = false;
		}
	}

	function formatDelta(delta: number): string {
		const sign = delta >= 0 ? '+' : '';
		return `${sign}${delta.toFixed(2)}`;
	}
</script>

<div class="flex flex-col h-full w-full gap-3">
	<!-- Header row -->
	<div class="flex items-center justify-between">
		<span class="text-xs font-medium text-[#555]">{currentMatch.date}</span>
	</div>

	<!-- Player rows -->
	{#key currentIndex}
	<div
		class="flex flex-col gap-2 flex-1"
		class:opacity-50={loading}
		in:fly={{ x: direction === 'left' ? -80 : 80, duration: 200 }}
	>
		{#each currentMatch.players as player (player.id)}
			<div
				class="flex items-center justify-between rounded-lg px-3 py-2 {player.isCurrentUser
					? 'bg-white/6'
					: ''}"
			>
				<!-- Left: rank position + name -->
				<div class="flex items-center gap-2 min-w-0">
					<span class="text-xs font-bold text-[#555] w-4 shrink-0">
						#{player.rank}
					</span>
					<span
						class="text-sm font-medium truncate {player.isCurrentUser
							? 'text-white'
							: 'text-neutral-400'}"
					>
						{player.name}
					</span>
				</div>

				<!-- Right: rating + delta -->
				<div class="flex items-center gap-3 shrink-0">
					<span class="text-sm font-semibold text-white tabular-nums">
						{player.rating.toFixed(2)}
					</span>
					{#if player.delta !== null}
						<span
							class="text-xs font-bold tabular-nums {player.delta >= 0
								? 'text-[#00FF88]'
								: 'text-[#FF3366]'}"
						>
							{formatDelta(player.delta)}
						</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>
	{/key}

	<!-- Navigation arrows -->
	{#if gameIds.length > 1}
		<div class="flex items-center justify-center gap-4 pt-1">
			<button
				onclick={() => navigate('prev')}
				disabled={!hasPrev || loading}
				class="text-neutral-500 transition-colors hover:text-white disabled:opacity-25 disabled:cursor-default"
				aria-label="Older match"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
					<path fill-rule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
				</svg>
			</button>
			<span class="text-xs text-[#555] tabular-nums">{currentIndex + 1} / {gameIds.length}</span>
			<button
				onclick={() => navigate('next')}
				disabled={!hasNext || loading}
				class="text-neutral-500 transition-colors hover:text-white disabled:opacity-25 disabled:cursor-default"
				aria-label="Newer match"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
					<path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
				</svg>
			</button>
		</div>
	{/if}
</div>
