import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/** Routes that don't require authentication. */
const PUBLIC_PATHS = ['/', '/callback', '/proxy-check'];

export const load: LayoutServerLoad = async ({ fetch, url }) => {
    const res = await fetch('/api/user', {
        credentials: 'include'
    });

    const user = res.ok ? await res.json() : null;

    if (!user && !PUBLIC_PATHS.includes(url.pathname)) {
        throw redirect(303, '/');
    }

    return {
        user
    };
};