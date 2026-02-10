import type { ServerLoad } from '@sveltejs/kit';

export const load = (async ({ fetch, parent }) => {
    // Get user from parent layout
    const { user } = await parent();
    
    if (!user) {
        return {
            leaderboard: [],
            lastMatch: null,
            userPosition: 0,
            totalPlayers: 0
        };
    }

    // Parallel fetch requests for better performance
    const [leaderboardRes, matchesRes, allUsersRes] = await Promise.all([
        fetch('/api/leaderboard'),
        fetch('/api/user/matches?limit=5'),
        fetch('/api/users')
    ]);

    const leaderboard = leaderboardRes.ok ? await leaderboardRes.json() : [];
    const matches = matchesRes.ok ? await matchesRes.json() : [];
    const allUsers = allUsersRes.ok ? await allUsersRes.json() : [];

    // Calculate user's position in overall ranking
    const sortedUsers = allUsers.sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0));
    const userPosition = sortedUsers.findIndex((u: any) => u.id === user.id) + 1;
    const totalPlayers = allUsers.length;

    return {
        leaderboard,
        lastMatch: matches[0] || null,
        userPosition,
        totalPlayers
    };
}) satisfies ServerLoad;
