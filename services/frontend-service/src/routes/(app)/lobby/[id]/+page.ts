
import { redirect } from "@sveltejs/kit";
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
        if (res.status === 404) {
            throw redirect(303, "/dashboard");
        }
        if (res.ok) {
            gameRecord = await res.json();
        }
    } catch (err) {
        if (err && typeof err === "object" && "status" in err) throw err; // re-throw redirects
        console.error("[lobby] load: failed to fetch game record", err);
    }

    const completedGames = (user!.games ?? []).filter((g) => g.status === 'completed').length;

    return {
        lobbyId: id,
        user: user!,
        gameRecord,
        completedGames,
    };
};
