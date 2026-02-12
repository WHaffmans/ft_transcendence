import type { ServerLoad } from '@sveltejs/kit';

interface PivotData {
    rating_mu: number;
    rating_sigma: number;
    rank: number;
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

export interface RankPoint {
    date: string;
    rating: number;
}

function buildRankHistory(matches: Match[], userId: number): RankPoint[] {
    return matches
        .slice()
        .reverse() // oldest first for chronological order
        .reduce<RankPoint[]>((history, match) => {
            const pivot = match.users.find((u) => u.id === userId)?.user_game;
            if (!pivot?.rating_mu || !pivot?.rating_sigma) return history;

            const rating = Math.round((pivot.rating_mu - 3 * pivot.rating_sigma) * 100) / 100;
            const date = new Date(match.updated_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            history.push({ date, rating });
            return history;
        }, []);
}

export const load = (async ({ fetch, parent }) => {
    const { user } = await parent();

    if (!user) {
        return {
            leaderboard: [],
            lastMatch: null,
            rankHistory: [],
            userPosition: 0,
            totalPlayers: 0
        };
    }

    const [leaderboardRes, matchesRes, allUsersRes] = await Promise.all([
        fetch('/api/leaderboard'),
        fetch('/api/user/matches?limit=20'),
        fetch('/api/users')
    ]);

    const leaderboard = leaderboardRes.ok ? await leaderboardRes.json() : [];
    const matches: Match[] = matchesRes.ok ? await matchesRes.json() : [];
    const allUsers = allUsersRes.ok ? await allUsersRes.json() : [];

    const sortedUsers = allUsers.sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0));
    const userPosition = sortedUsers.findIndex((u: any) => u.id === user.id) + 1;
    const totalPlayers = allUsers.length;
    const rankHistory = buildRankHistory(matches, user.id);

    return {
        leaderboard,
        lastMatch: matches[0] || null,
        rankHistory,
        userPosition,
        totalPlayers
    };
}) satisfies ServerLoad;
