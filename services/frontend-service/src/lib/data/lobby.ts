import type { LobbyData } from '$lib/types/types';

// Mock lobby data with 4 player slots (2x2 grid)
export const mockLobbyData: LobbyData = {
	maxPlayers: 4,
	currentUserId: 2,
	players: [
		{
			id: 1,
			username: 'hesmolde',
			avatar: '/placeholders/avatars/hesmolde.png',
			rank: 9.69,
			status: 'ready',
			isCurrentUser: false
		},
		{
			id: 2,
			username: 'fras',
			avatar: '/placeholders/avatars/fras.png',
			rank: 11.81,
			status: 'ready',
			isCurrentUser: true
		},
		{
			id: 3,
			username: 'qmennen',
			avatar: '/placeholders/avatars/qmennen.png',
			rank: 14.86,
			status: 'ready',
			isCurrentUser: false
		},
		null // Empty slot - waiting for player
	]
};
