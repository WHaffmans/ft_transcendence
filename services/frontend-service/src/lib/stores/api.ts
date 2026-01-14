import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { sha256 } from 'js-sha256';
import { PUBLIC_CLIENT_ID, PUBLIC_DOMAIN, PUBLIC_OAUTH_REDIRECT_URI } from '$env/static/public';
import type { User } from '$lib/types/types';
import { base64UrlEncode, arrayToString, generateRandomString } from '$lib/utils';

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
      if (!browser) return null;

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

      const client_id = PUBLIC_CLIENT_ID;
      const redirect_uri = encodeURIComponent(PUBLIC_OAUTH_REDIRECT_URI);
      const state = generateRandomString(40);
      sessionStorage.setItem("pkce_state", state);

      const code_verifier = generateRandomString(128);
      sessionStorage.setItem("pkce_code_verifier", code_verifier);

      const code_challenge = base64UrlEncode(
        arrayToString(sha256.create().update(code_verifier).array())
      );

      const response_type = "code";
      const scope = encodeURIComponent("user:read");
      const auth_url = `http://${PUBLIC_DOMAIN}/auth/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=${response_type}&scope=${scope}&state=${state}&code_challenge=${code_challenge}&code_challenge_method=S256`;
      
      window.location.href = auth_url;
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
            client_id: PUBLIC_CLIENT_ID,
            code: code,
            redirect_uri: PUBLIC_OAUTH_REDIRECT_URI,
            code_verifier: codeVerifier,
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange authorization code for tokens');
        }

        const tokenData = await tokenResponse.json();
        this.setTokens(tokenData.access_token, tokenData.refresh_token);

        // Fetch user data
        this.fetchApi(`/user`).then((data) => {
          set({ user: data, isLoading: false, isAuthenticated: ! (data == null) });
        });        return true;
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