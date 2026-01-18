

// Import types
import type { PageLoad } from "./$types";
import type { User } from "$lib/types/types";

// Fetch data for leaderboard
export const load: PageLoad = async ({fetch}) => {

	const res = await fetch('http://backend-service:4000/api/leaderboard');

	if (!res.ok)
	{
		throw new Error('Failed to fetch leaderboard');
	}

	const players: User[] = await res.json();

	return { players };
};

