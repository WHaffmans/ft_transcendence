export interface User {
    id: number;
    name: string;
    email: string;
    avatar_url: string;
    rating_mu: number;
    rating_sigma: number;
    created_at: string;
    updated_at: string;
}

export interface Game {
    id: string;
    status: string;
    created_at: string;
    updated_at: string;
    users: User[];
}

export interface RankingPlayer {
    position: number;
    username: string;
    rank: number;
    avatar: string;
}

export interface MatchResult {
    opponent: string;
    result: 'WIN' | 'LOSS';
    timestamp?: string;
}

export interface DashboardData {
    currentUser: {
        username: string;
        avatar: string;
        rank: number;
        position: number;
    };
    lastMatch: MatchResult;
    globalRanking: RankingPlayer[];
    serverStatus: {
        name: string;
        playersOnline: number;
    };
}