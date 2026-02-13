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

export interface RatingPoint {
    date: string;
    rating: number;
}

export interface LastMatchPlayer {
    id: number;
    name: string;
    rating: number;
    delta: number | null;
    rank: number;
    isCurrentUser: boolean;
}

export interface LastMatchData {
    players: LastMatchPlayer[];
    date: string;
}

function computeRating(pivot: PivotData): number {
    return Math.round((pivot.rating_mu - 3 * pivot.rating_sigma) * 100) / 100;
}

function buildRatingHistory(matches: Match[], userId: number): RatingPoint[] {
    return matches
        .slice()
        .reverse()
        .reduce<RatingPoint[]>((history, match) => {
            const pivot = match.users.find((u) => u.id === userId)?.user_game;
            if (!pivot?.rating_mu || !pivot?.rating_sigma) return history;

            const rating = computeRating(pivot);
            const date = new Date(match.updated_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            history.push({ date, rating });
            return history;
        }, []);
}

function buildLastMatchData(matches: Match[], userId: number): LastMatchData | null {
    if (matches.length === 0) return null;

    const lastMatch = matches[0];
    const previousMatch = matches[1] ?? null;

    const players: LastMatchPlayer[] = lastMatch.users.map((user) => {
        const postRating = computeRating(user.user_game);
        let delta: number | null = null;

        if (user.id === userId && previousMatch) {
            const prevPivot = previousMatch.users.find((u) => u.id === userId)?.user_game;
            if (prevPivot?.rating_mu && prevPivot?.rating_sigma) {
                delta = Math.round((postRating - computeRating(prevPivot)) * 100) / 100;
            }
        } else if (user.id !== userId) {
            // Search earlier matches for this opponent's prior appearance
            for (let i = 1; i < matches.length; i++) {
                const prevPivot = matches[i].users.find((u) => u.id === user.id)?.user_game;
                if (prevPivot?.rating_mu && prevPivot?.rating_sigma) {
                    delta = Math.round((postRating - computeRating(prevPivot)) * 100) / 100;
                    break;
                }
            }
        }

        return {
            id: user.id,
            name: user.name,
            rating: postRating,
            delta,
            rank: user.user_game.rank,
            isCurrentUser: user.id === userId
        };
    });

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
        return {
            leaderboard: [],
            lastMatch: null,
            ratingHistory: [],
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
