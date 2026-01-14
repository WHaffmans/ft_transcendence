import type { HandleFetch } from "@sveltejs/kit";

export const handleFetch: HandleFetch = async ({ request, fetch }) => {
    console.log("handleFetch called for:", request.url);
    if (request.url.includes("/auth/api")) {
        const token = localStorage.getItem("access_token");
        if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
        }
    }

    return fetch(request);
};