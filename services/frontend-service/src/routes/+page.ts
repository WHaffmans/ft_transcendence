import type { PageLoad } from "./$types";
import { PUBLIC_DOMAIN } from '$env/static/public';

export const load: PageLoad = async ({ }) => {
    try {
        const response = await fetch(`https://${PUBLIC_DOMAIN}/auth/users`);
        const json = await response.json();
        return {
            users: json.users
        };
    } catch (e) {
        console.log('Error fetching users:', e);
        return {
            users: []
        }
    }

}