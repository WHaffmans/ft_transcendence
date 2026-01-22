import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { User } from '$lib/types/types';
import { openPopup } from '$lib/utils/oauth';
import { env } from "$env/dynamic/public";

interface ApiState {
  user: User | null;
  accessToken?: string;
  refreshToken?: string;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const createApiStore = () => {
  const { subscribe, set, update } = writable<ApiState>({
    user: null,
    accessToken: undefined,
    refreshToken: undefined,
    isLoading: true,
    isAuthenticated: false
  });

  return {
    subscribe,

    async fetchApi(endpoint: string, method: string = 'GET', body?: any) {
      if (!browser) {
        return;
      }

      const token = localStorage.getItem("access_token");
      if (!token) {
        set({ user: null, isLoading: false, isAuthenticated: false });
        return null;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      try {
        const response = await fetch(`/api${endpoint}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        if (response.ok) {
          return await response.json();
        } else {
          console.error(`API request failed: ${response.status} ${response.statusText}`);
          return null;
        }
      } catch (error) {
        console.error("API request error:", error);
        return null;
      }
    },

    async login() {
      if (!browser) return;

      return openPopup(
        `http://${env.PUBLIC_DOMAIN}/auth/oauth/authorize`,
        'oauth2_login',
        500,
        600,
        (code, state) => this.handleOAuthCallbackFromPopup(code, state)
      );

    },

    async handleOAuthCallback(urlParams: URLSearchParams) {
      if (!browser) return false;

      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        return false;
      }

      if (!code || !state) {
        console.error('Missing code or state in OAuth callback');
        return false;
      }

      return this.handleOAuthCallbackFromPopup(code, state);
    },

    async handleOAuthCallbackFromPopup(code: string, state: string): Promise<boolean> {
      if (!browser) return false;

      const storedState = sessionStorage.getItem('pkce_state');
      const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

      if (!storedState || !codeVerifier || state !== storedState) {
        console.error('Invalid state parameter');
        return false;
      }

      // Clean up session storage
      sessionStorage.removeItem('pkce_state');
      sessionStorage.removeItem('pkce_code_verifier');

      update(state => ({ ...state, isLoading: true }));

      try {
        // Exchange authorization code for tokens
        const tokenResponse = await fetch('/auth/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: env.PUBLIC_CLIENT_ID,
            code: code,
            redirect_uri: env.PUBLIC_OAUTH_REDIRECT_URI,
            code_verifier: codeVerifier,
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange authorization code for tokens');
        }

        const tokenData = await tokenResponse.json();
        this.setTokens(tokenData.access_token, tokenData.refresh_token);

        // Fetch user data
        const userData = await this.fetchApi(`/user`);
        set({ user: userData, isLoading: false, isAuthenticated: userData !== null });

        return true;
      } catch (error) {
        console.error('OAuth token exchange failed:', error);
        set({ user: null, isLoading: false, isAuthenticated: false });
        return false;
      }
    },


    async logout() {
      const token = localStorage.getItem("access_token");

      try {
        await fetch("/auth/api/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("Logout failed:", error);
      } finally {
        this.clearTokens();
        set({ user: null, isLoading: false, isAuthenticated: false });
        if (browser) {
          window.location.href = "/";
        }
      }
    },

    clearTokens() {
      if (browser) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        sessionStorage.removeItem("pkce_state");
        sessionStorage.removeItem("pkce_code_verifier");
      }
    },

    setTokens(accessToken: string, refreshToken?: string) {
      if (browser) {
        localStorage.setItem("access_token", accessToken);
        if (refreshToken) {
          localStorage.setItem("refresh_token", refreshToken);
        }
      }

      update(state => ({ ...state, accessToken, refreshToken }));
    },

    init() {
      if (browser) {
        this.fetchApi(`/user`).then((data) => {
          set({ user: data, isLoading: false, isAuthenticated: ! (data == null) });
        });
      }
    }
  };
};

export const apiStore = createApiStore();