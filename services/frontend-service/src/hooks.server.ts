import type { Handle, RequestEvent } from '@sveltejs/kit';

const isProduction = process.env.NODE_ENV === 'production';
const backendBaseUrl = isProduction 
	? 'https://backend-service:4443'
	: 'http://backend-service:4000';

let refreshPromise: Promise<RefreshResult | null> | null = null;

interface RefreshResult {
	accessToken: string;
	setCookies: string[];
}

function cleanResponseHeaders(headers: Headers): Headers {
	const cleaned = new Headers(headers);
	cleaned.delete('content-encoding');
	cleaned.delete('content-length');
	cleaned.delete('transfer-encoding');
	return cleaned;
}

function isProxyPath(pathname: string): boolean {
	return pathname.startsWith('/api') || pathname.startsWith('/auth') || pathname.startsWith('/storage');
}

async function refreshAccessToken(refreshToken: string): Promise<RefreshResult | null> {
	const headers = new Headers();
	headers.set('host', new URL(backendBaseUrl).host);
	headers.set('content-type', 'application/json');
	headers.set('cookie', `refresh_token=${refreshToken}`);

	try {
		const response = await fetch(`${backendBaseUrl}/auth/refresh`, {
			method: 'POST',
			headers
		});

		console.log(`[proxy] Refresh token response: ${response.status} ${response.statusText}`);

		if (!response.ok) return null;

		const data = await response.json();
		return { accessToken: data.access_token, setCookies: response.headers.getSetCookie() };
	} catch (error) {
		console.error('[proxy] Failed to refresh access token:', error);
		return null;
	}
}

async function getRefreshResult(refreshToken: string): Promise<RefreshResult | null> {
	if (!refreshPromise) {
		refreshPromise = refreshAccessToken(refreshToken).finally(() => {
			setTimeout(() => { refreshPromise = null; }, 100);
		});
	}
	return refreshPromise;
}

function createProxyRequest(
	event: RequestEvent,
	targetUrl: string,
	body: ArrayBuffer | undefined,
	accessToken?: string
): Promise<Response> {
	const headers = new Headers(event.request.headers);
	headers.set('host', new URL(backendBaseUrl).host);
	if (accessToken) {
		headers.set('Authorization', `Bearer ${accessToken}`);
	}
	return fetch(targetUrl, {
		method: event.request.method,
		headers,
		body,
		redirect: 'manual'
	});
}

function createProxyResponse(backendResponse: Response, extraCookies: string[] = []): Response {
	const headers = cleanResponseHeaders(backendResponse.headers);
	for (const cookie of extraCookies) {
		headers.append('set-cookie', cookie);
	}
	return new Response(backendResponse.body, {
		status: backendResponse.status,
		statusText: backendResponse.statusText,
		headers
	});
}

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (!isProxyPath(pathname)) {
		return resolve(event);
	}

	const targetUrl = `${backendBaseUrl}${pathname}${event.url.search}`;
	console.log(`[proxy] ${event.request.method} ${targetUrl}`);

	const body = ['GET', 'HEAD'].includes(event.request.method)
		? undefined
		: await event.request.arrayBuffer();

	const accessToken = event.cookies.get('access_token');
	let response = await createProxyRequest(event, targetUrl, body, accessToken);

	const refreshToken = event.cookies.get('refresh_token');

	if (refreshToken && response.status === 401 && pathname !== '/auth/refresh') {
		const refreshResult = await getRefreshResult(refreshToken);
		if (refreshResult) {
			response = await createProxyRequest(event, targetUrl, body, refreshResult.accessToken);
			return createProxyResponse(response, refreshResult.setCookies);
		}
	}

	return createProxyResponse(response);
};
