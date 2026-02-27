/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   timers.ts                                          :+:    :+:            */
/*                                                     +:+                    */
/*   By: quentinbeukelman <quentinbeukelman@stud      +#+                     */
/*                                                   +#+                      */
/*   Created: 2026/02/26 08:31:41 by quentinbeuk   #+#    #+#                 */
/*   Updated: 2026/02/26 08:49:54 by quentinbeuk   ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

export type TimeoutHandle = ReturnType<typeof setTimeout> | null;
export type IntervalHandle = ReturnType<typeof setInterval> | null;

export function replaceTimeout<T, K extends keyof T>(
	holder: T,
	key: K,
	ms: number,
	fn: () => void,
) {
	const existing = holder[key] as unknown as TimeoutHandle | undefined;
	if (existing) clearTimeout(existing);

	const handle = setTimeout(fn, ms);
	holder[key] = handle as unknown as T[K];

	return () => {
		const current = holder[key] as unknown as TimeoutHandle | undefined;
		if (!current) return;
		clearTimeout(current);
		holder[key] = null as unknown as T[K];
	};
}

export function replaceInterval<T, K extends keyof T>(
	holder: T,
	key: K,
	ms: number,
	fn: () => void,
) {
	const existing = holder[key] as unknown as IntervalHandle | undefined;
	if (existing) clearInterval(existing);

	const handle = setInterval(fn, ms);
	holder[key] = handle as unknown as T[K];

	return () => {
		const current = holder[key] as unknown as IntervalHandle | undefined;
		if (!current) return;
		clearInterval(current);
		holder[key] = null as unknown as T[K];
	};
}

export function replaceMapTimeout(
	map: Record<string, TimeoutHandle>,
	key: string,
	ms: number,
	fn: () => void,
): { stop: () => void; getHandle: () => TimeoutHandle } {
	const existing = map[key];
	if (existing) clearTimeout(existing);

	let stopped = false;

	const handle = setTimeout(() => {
		if (stopped) return;
		stopped = true;
		map[key] = null;
		fn();
	}, ms);

	map[key] = handle;

	const stop = () => {
		const current = map[key];
		if (!current) return;
		clearTimeout(current);
		map[key] = null;
		stopped = true;
	};

	return {
		stop,
		getHandle: () => map[key] ?? null,
	};
}
