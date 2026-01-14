import { apiStore } from '../../../lib/stores/api.js';

export function load({ params }) {
    const { id } = params;

    return {
        lobbyId: id,
    };
}