import type { Handle } from '@sveltejs/kit';

const backendBaseUrl = 'http://backend-service:4000';

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
