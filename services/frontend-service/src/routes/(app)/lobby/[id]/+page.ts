
import type { PageLoad } from "./$types";
import type { Game } from "$lib/types/types";

export const ssr = false;

export const load: PageLoad = async ({ params, fetch, parent, depends }) => {
    depends('app:gameRecord');

    const { id } = params;
    const { user } = await parent();

    let gameRecord: Game | null = null;
    try {
        const res = await fetch(`/api/games/${id}`);
        if (res.ok) {
            gameRecord = await res.json();
        }
    } catch (err) {
        console.error("[lobby] load: failed to fetch game record", err);
    }

    return {
        lobbyId: id,
        user: user!,
        gameRecord,
    };
};
