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

function buildRatingHistory(matches: Match[], userId: number): RatingPoint[] {
    return matches
        .slice()
        .reverse()
        .reduce<RatingPoint[]>((history, match) => {
            const pivot = match.users.find((u) => u.id === userId)?.user_game;
            if (pivot?.rating == null) return history;

            const date = new Date(match.updated_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            history.push({ date, rating: Number(pivot.rating) });
            return history;
        }, []);
}

function buildLastMatchData(matches: Match[], userId: number): LastMatchData | null {
    if (matches.length === 0) return null;

    const lastMatch = matches[0];

    const players: LastMatchPlayer[] = lastMatch.users.map((user) => ({
        id: user.id,
        name: user.name,
        rating: Number(user.user_game.rating),
        delta: user.user_game.diff != null ? Number(user.user_game.diff) : null,
        rank: user.user_game.rank,
        isCurrentUser: user.id === userId
    }));

    // Sort by rank (lower = better finish)
    players.sort((a, b) => a.rank - b.rank);

    const date = new Date(lastMatch.updated_at).toLocaleDateString('en-US', {
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

    const [leaderboardRes, matchesRes, allUsersRes] = await Promise.all([
        fetch('/api/leaderboard'),
        fetch('/api/user/matches?limit=20'),
        fetch('/api/users')
    ]);

    const leaderboard = leaderboardRes.ok ? await leaderboardRes.json().catch(() => []) : [];
    const matches: Match[] = matchesRes.ok ? await matchesRes.json().catch(() => []) : [];
    const allUsers = allUsersRes.ok ? await allUsersRes.json().catch(() => []) : [];

    const sortedUsers = allUsers.sort((a: User, b: User) => (b.rating ?? 0) - (a.rating ?? 0));
    const userPosition = sortedUsers.findIndex((u: User) => u.id === user.id) + 1;
    const totalPlayers = allUsers.length;
    const ratingHistory = buildRatingHistory(matches, user.id);
    const lastMatch = buildLastMatchData(matches, user.id);

    return {
        leaderboard,
        lastMatch,
        ratingHistory,
        userPosition,
        totalPlayers
    };
}) satisfies ServerLoad;
