export interface User {
    id: number;
    name: string;
    email: string;
    avatar_url: string;
    rating_mu: number;
    rating_sigma: number;
    rating: number;
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
    id: number;
    position: number;
    username: string;
    rank: number;
    avatar: string;
}

export interface MatchResult {
    id: string;
    opponent: string;
    opponentId: number;
    result: 'WIN' | 'LOSS';
    timestamp: string;
    score?: {
        player: number;
        opponent: number;
    };
}

export interface DashboardData {
    currentUser: {
        id: number;
        username: string;
        avatar: string;
        rank: number;
        position: number;
    };
    lastMatch: MatchResult | null;
    globalRanking: RankingPlayer[];
    serverStatus: {
        name: string;
        playersOnline: number;
    };
}

export type LobbyPlayerStatus = 'host' | 'ready' | 'not-ready';

export interface LobbyPlayer {
    id: number;
    username: string;
    avatar: string;
    rank: number;
    status: LobbyPlayerStatus;
    isCurrentUser: boolean;
}

export interface LobbyData {
    players: (LobbyPlayer | null)[]; // null represents empty slot
    maxPlayers: number;
    currentUserId: number;
}


export interface WSMessage {
  type: string;
  [key: string]: any;
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