import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';

const AUTH_PAGES = ['/login', '/callback'];
const PUBLIC_PAGES = ['/', '/health'];

export const load = async ({ url }) => {
  if (browser) {
    const token = localStorage.getItem('access_token');
    const isAuthPage = AUTH_PAGES.includes(url.pathname);
    const isPublicPage = PUBLIC_PAGES.includes(url.pathname);
    
    // If no token and trying to access protected route
    if (!token && !isAuthPage && !isPublicPage) {
      throw redirect(302, '/login');
    }
    
    // If has token and trying to access landing/login
    if (token && (url.pathname === '/' || url.pathname === '/login')) {
      throw redirect(302, '/dashboard');
    }
    
    return { 
      isAuthenticated: !!token 
    };
  }
  
  return { 
    isAuthenticated: false 
  };
};