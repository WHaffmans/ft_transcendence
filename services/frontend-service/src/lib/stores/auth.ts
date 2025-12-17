import { writable } from "svelte/store";
import type { User } from "../types/types";
import { sha256 } from "js-sha256";
import {
    PUBLIC_CLIENT_ID,
    PUBLIC_DOMAIN,
    PUBLIC_OAUTH_REDIRECT_URI,
} from "$env/static/public";
import { arrayToString, base64, randomString } from "../utils";
import { goto } from "$app/navigation";

type AuthState = {
    user: User | null;
    loading: boolean;
};

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthState>({
        user: null,
        loading: true
    });

    return {
        subscribe,

        login: async () => {
            let client_id = `${PUBLIC_CLIENT_ID}`;
            let redirect_uri = encodeURIComponent(`${PUBLIC_OAUTH_REDIRECT_URI}`);
            let state = randomString(40);
            localStorage.setItem("pkce_state", state);

            let code_verifier = randomString(128);
            localStorage.setItem("pkce_code_verifier", code_verifier);

            let code_challenge = base64(
                arrayToString(sha256.create().update(code_verifier).array())
            );

            let response_type = "code";
            let scope = encodeURIComponent("user:read");
            let auth_url = `http://${PUBLIC_DOMAIN}/auth/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=${response_type}&scope=${scope}&state=${state}&code_challenge=${code_challenge}&code_challenge_method=S256`;

            const width = 600;
            const height = 700;
            const left = (window.innerWidth - width) / 2;
            const top = (window.innerHeight - height) / 2;
            window.open(
                auth_url,
                "oauth-popup",
                `width=${width},height=${height},top=${top},left=${left}`
            );
        },

        logout: async () => {
            try {
                await fetch("/auth/api/logout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                    },
                });
            } catch (error) {
                console.error("Logout failed:", error);
            } finally {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                update(state => ({ ...state, user: null }));
                goto("/");
            }
        },

        fetchUser: async () => {
            const token = localStorage.getItem("access_token");
            if (!token) {
                update(state => ({ ...state, loading: false }));
                return;
            }

            try {
                const response = await fetch("/auth/api/user", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const user = await response.json();
                    update(state => ({ ...state, user }));
                } else {
                    // Token invalid, clear it
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    update(state => ({ ...state, user: null }));
                }
            } catch (error) {
                console.error("Failed to fetch user:", error);
                update(state => ({ ...state, user: null }));
            } finally {
                update(state => ({ ...state, loading: false }));
            }
        }
    };
}

export const auth = createAuthStore();
