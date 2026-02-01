import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { openOAuthPopup } from '$lib/utils/oauth';

interface ApiState {
  isLoading: boolean;
  isAuthenticated: boolean;
}

const createApiStore = () => {
  const { subscribe, set, update } = writable<ApiState>({
    isLoading: true,
    isAuthenticated: false
  });

  return {
    subscribe,
    
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
      return true;
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
        return true;
      } catch (error) {
        console.error("Logout failed:", error);
        return false;
      } finally {
        set({ isLoading: false, isAuthenticated: false });
      }
    },
  };
};

export const apiStore = createApiStore();