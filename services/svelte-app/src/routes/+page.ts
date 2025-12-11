import type { PageLoad } from "./$types";
import { PUBLIC_DOMAIN } from '$env/static/public';

export const load: PageLoad = async ({ }) => {
    try {
        const response = await fetch(`http://${PUBLIC_DOMAIN}/user-service/users`);
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