import type { Handle } from '@sveltejs/kit';

const isProduction = process.env.NODE_ENV === 'production';
const backendBaseUrl = isProduction 
	? 'https://backend-service:4443'
	: 'http://backend-service:4000';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	console.log('Incoming request for:', pathname);
	if (pathname.startsWith('/api') || pathname.startsWith('/auth')) {
		console.log('Proxying request to backend:', backendBaseUrl);
		const targetUrl = `${backendBaseUrl}${pathname}${event.url.search}`;
		console.log('Target URL:', targetUrl);
		const headers = new Headers(event.request.headers);
		headers.set('host', new URL(backendBaseUrl).host);

		const accessToken = event.cookies.get('access_token');
		if (accessToken && !headers.has('Authorization')) {
			console.log('Attaching access token to request headers');
			headers.set('Authorization', `Bearer ${accessToken}`);
		}

		const requestInit: RequestInit = {
			method: event.request.method,
			headers,
			body: ['GET', 'HEAD'].includes(event.request.method)
				? undefined
				: await event.request.arrayBuffer(),
			redirect: 'manual'
		};

		return fetch(targetUrl, requestInit);
	}

	return resolve(event);
};
