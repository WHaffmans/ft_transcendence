
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
    const { id } = params;
    const { user } = await parent();

    return {
        lobbyId: id,
        user
    };
}
