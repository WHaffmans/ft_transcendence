import { redirect } from '@sveltejs/kit';
import type { ServerLoad } from '@sveltejs/kit';
import type { RatingPoint, LastMatchData, LastMatchPlayer, User } from '$lib/types/types';

interface PivotData {
    rating_mu: number;
    rating_sigma: number;
    rating: number | string;
    rank: number;
    diff: number | string | null;
}

interface UserGame {
    id: string;
    status: string;
    updated_at: string;
    user_game: PivotData;
}

interface MatchUser {
    id: number;
    name: string;
    user_game: PivotData;
}

interface Match {
    id: string;
    status: string;
    updated_at: string;
    users: MatchUser[];
}

export type { RatingPoint, LastMatchData, LastMatchPlayer };

function buildRatingHistory(games: UserGame[]): RatingPoint[] {
    return games
        .slice()
        .reverse()
        .reduce<RatingPoint[]>((history, game) => {
            if (game.user_game?.rating == null) return history;

            const date = new Date(game.updated_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            history.push({ date, rating: Number(game.user_game.rating) });
            return history;
        }, []);
}

function buildLastMatchData(match: Match, userId: number): LastMatchData {
    const players: LastMatchPlayer[] = match.users.map((user) => ({
        id: user.id,
        name: user.name,
        rating: Number(user.user_game.rating),
        delta: user.user_game.diff != null ? Number(user.user_game.diff) : null,
        rank: user.user_game.rank,
        isCurrentUser: user.id === userId
    }));

    // Sort by rank (lower = better finish)
    players.sort((a, b) => a.rank - b.rank);

    const date = new Date(match.updated_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });

    return { players, date };
}

export const load = (async ({ fetch, parent }) => {
    const { user } = await parent();

    if (!user) {
        throw redirect(302, '/');
    }

    // user.games[] comes from the layout (limited to 20, sorted desc)
    const userGames: UserGame[] = user.games ?? [];
    const completedGames = userGames.filter((g: UserGame) => g.status === 'completed');

    // Fetch leaderboard, all users (for position), and last match details in parallel
    const lastGameId = completedGames[0]?.id;
    const fetches: Promise<Response>[] = [
        fetch('/api/leaderboard'),
        fetch('/api/users')
    ];
    if (lastGameId) {
        fetches.push(fetch(`/api/games/${lastGameId}`));
    }

    const [leaderboardRes, allUsersRes, lastGameRes] = await Promise.all(fetches);

    const leaderboard = leaderboardRes.ok ? await leaderboardRes.json().catch(() => []) : [];
    const allUsers = allUsersRes.ok ? await allUsersRes.json().catch(() => []) : [];

    const sortedUsers = allUsers.sort((a: User, b: User) => (b.rating ?? 0) - (a.rating ?? 0));
    const userPosition = sortedUsers.findIndex((u: User) => u.id === user.id) + 1;
    const totalPlayers = allUsers.length;
    const ratingHistory = buildRatingHistory(completedGames);

    let lastMatch: LastMatchData | null = null;
    if (lastGameRes?.ok) {
        const lastGame: Match = await lastGameRes.json().catch(() => null);
        if (lastGame) {
            lastMatch = buildLastMatchData(lastGame, user.id);
        }
    }

    return {
        leaderboard,
        lastMatch,
        ratingHistory,
        userPosition,
        totalPlayers,
        completedGameIds: completedGames.map((g) => g.id)
    };
}) satisfies ServerLoad;
