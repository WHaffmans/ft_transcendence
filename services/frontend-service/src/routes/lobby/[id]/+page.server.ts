import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
    const { id } = params;

    return {
        lobbyId: id,
    };
};