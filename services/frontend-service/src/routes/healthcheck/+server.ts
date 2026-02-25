import { json } from '@sveltejs/kit';
import * as net from 'net';
import type { ContainerHealth } from '$lib/types/types';

const isProduction = process.env.NODE_ENV === 'production';

interface HealthTarget {
	name: string;
	check: () => Promise<boolean>;
}

function httpCheck(url: string, timeoutMs = 2000): () => Promise<boolean> {
	return async () => {
		try {
			const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
			return res.ok;
		} catch {
			return false;
		}
	};
}

function tcpCheck(host: string, port: number, timeoutMs = 2000): () => Promise<boolean> {
	return () =>
		new Promise<boolean>((resolve) => {
			const socket = new net.Socket();
			socket.setTimeout(timeoutMs);
			socket.once('connect', () => {
				socket.destroy();
				resolve(true);
			});
			socket.once('timeout', () => {
				socket.destroy();
				resolve(false);
			});
			socket.once('error', () => {
				socket.destroy();
				resolve(false);
			});
			socket.connect(port, host);
		});
}

const targets: HealthTarget[] = isProduction
	? [
			{ name: 'frontend', check: httpCheck('https://localhost:3000/health') },
			{ name: 'backend', check: httpCheck('https://backend-service:4443/up') },
			{ name: 'game', check: tcpCheck('game-service', 3443) },
			{ name: 'gateway', check: httpCheck('http://gateway:8080/ping') },
			{ name: 'mariadb', check: tcpCheck('mariadb', 3306) }
		]
	: [
			{ name: 'frontend', check: httpCheck('http://localhost:5173/health') },
			{ name: 'backend', check: httpCheck('http://backend-service:4000/up') },
			{ name: 'game', check: tcpCheck('game-service', 3003) },
			{ name: 'gateway', check: httpCheck('http://gateway:80/ping') },
			{ name: 'mariadb', check: tcpCheck('mariadb', 3306) }
		];

export async function GET() {
	const results = await Promise.all(
		targets.map(async (target): Promise<ContainerHealth> => {
			const healthy = await target.check();
			return { name: target.name, status: healthy ? 'healthy' : 'unhealthy' };
		})
	);

	return json({ containers: results });
}
