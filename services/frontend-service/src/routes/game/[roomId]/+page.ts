import type { PageLoad } from "./$types";

// Disable SSR
export const ssr = false;

export const load: PageLoad = async ({ params }) => {
    const { roomId } = params;

    return {
        roomId,
    };
}