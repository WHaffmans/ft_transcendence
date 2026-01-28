import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { User } from '$lib/types/types';
import { openOAuthPopup } from '$lib/utils/oauth';

interface ApiState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const createApiStore = () => {
  const { subscribe, set, update } = writable<ApiState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  });

  return {
    subscribe,

    async fetchApi(endpoint: string, method: string = 'GET', body?: any) {
      if (!browser) {
        return;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      try {
        const response = await fetch(`/api${endpoint}`, {
          method,
          headers,
          credentials: "include",
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

      return openOAuthPopup(
        `/auth/oauth/initiate`,
        'oauth2_login',
        500,
        700,
      );
    },

    async handleOAuthCallback(urlParams: URLSearchParams) {
      if (!browser) return false;

      const error = urlParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        return false;
      }

      update(state => ({ ...state, isLoading: true }));

      try {
        const userData = await this.fetchApi(`/user`);
        set({ user: userData, isLoading: false, isAuthenticated: userData !== null });

        return userData !== null;
      } catch (error) {
        console.error('OAuth session check failed:', error);
        set({ user: null, isLoading: false, isAuthenticated: false });
        return false;
      }
    },


    async logout() {
      try {
        await fetch("/api/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
        });
      } catch (error) {
        console.error("Logout failed:", error);
      } finally {
        set({ user: null, isLoading: false, isAuthenticated: false });
      }
    },

    clearTokens() {
      return;
    },

    setTokens() {
      return;
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