import type { Handle } from '@sveltejs/kit';

const isProduction = process.env.NODE_ENV === 'production';
const backendBaseUrl = isProduction 
	? 'https://backend-service:4443'
	: 'http://backend-service:4000';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (pathname.startsWith('/api') || pathname.startsWith('/auth')) {
		const targetUrl = `${backendBaseUrl}${pathname}${event.url.search}`;
		console.log(`[proxy] ${event.request.method} ${targetUrl}`);
		const headers = new Headers(event.request.headers);
		headers.set('host', new URL(backendBaseUrl).host);

		const accessToken = event.cookies.get('access_token');
		if (accessToken && !headers.has('Authorization')) {
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

		const backendResponse = await fetch(targetUrl, requestInit);

		// Node's native fetch auto-decompresses gzip, but leaves the original
		// Content-Encoding / Content-Length headers intact. Returning those
		// causes SvelteKit to truncate the (now larger) decompressed body at the
		// old compressed Content-Length, producing broken JSON for large payloads.
		const responseHeaders = new Headers(backendResponse.headers);
		responseHeaders.delete('content-encoding');
		responseHeaders.delete('content-length');
		responseHeaders.delete('transfer-encoding');

		return new Response(backendResponse.body, {
			status: backendResponse.status,
			statusText: backendResponse.statusText,
			headers: responseHeaders
		});
	}

	return resolve(event);
};
