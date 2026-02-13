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