import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./lobby/[id]/$types";

export const load: PageServerLoad = async( {cookies} ) => {
    console.log("Checking authentication status in +page.server.ts");
    if (cookies.get('access_token')) {
        throw redirect(302, '/dashboard');
    }
};