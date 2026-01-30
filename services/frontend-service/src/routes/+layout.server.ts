import type { LayoutServerLoad } from './$types';

export const load : LayoutServerLoad = async ( {fetch} ) => {
    const res = await fetch('/api/user', {
        credentials: 'include'
    });

    const user = res.ok ? await res.json() : null;
    return {
        user
    };
};