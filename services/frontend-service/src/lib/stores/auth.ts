import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { sha256 } from 'js-sha256';
import { PUBLIC_CLIENT_ID, PUBLIC_DOMAIN, PUBLIC_OAUTH_REDIRECT_URI } from '$env/static/public';
import type { User } from '$lib/types/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const createAuthStore = () => {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  });

  return {
    subscribe,
    
    async fetchUser() {
      if (!browser) return;
      
      const token = localStorage.getItem("access_token");
      if (!token) {
        set({ user: null, isLoading: false, isAuthenticated: false });
        return;
      }

      update(state => ({ ...state, isLoading: true }));

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
          set({ user, isLoading: false, isAuthenticated: true });
        } else {
          // Token invalid, clear it
          this.clearTokens();
          set({ user: null, isLoading: false, isAuthenticated: false });
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        set({ user: null, isLoading: false, isAuthenticated: false });
      }
    },

    async login() {
      if (!browser) return;

      const client_id = PUBLIC_CLIENT_ID;
      const redirect_uri = encodeURIComponent(PUBLIC_OAUTH_REDIRECT_URI);
      const state = this.generateRandomString(40);
      sessionStorage.setItem("pkce_state", state);

      const code_verifier = this.generateRandomString(128);
      sessionStorage.setItem("pkce_code_verifier", code_verifier);

      const code_challenge = this.base64UrlEncode(
        this.arrayToString(sha256.create().update(code_verifier).array())
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
        await this.fetchUser();
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
    },

    // Utility functions
    generateRandomString(length: number): string {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    },

    base64UrlEncode(str: string): string {
      return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    },

    arrayToString(array: number[]): string {
      return String.fromCharCode(...array);
    },

    init() {
      if (browser) {
        this.fetchUser();
      }
    }
  };
};

export const authStore = createAuthStore();