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