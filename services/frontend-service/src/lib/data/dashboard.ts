import type { DashboardData } from '$lib/types/types';

// Mock dashboard data - will be replaced with actual API calls
export const mockDashboardData: DashboardData = {
	currentUser: {
		id: 1,
		username: 'fras',
		avatar: '/placeholders/avatars/fras.png',
		rank: 1240,
		position: 42
	},
	lastMatch: {
		id: 'match-001',
		opponent: 'hesmolde',
		opponentId: 5,
		result: 'WIN',
		timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
		score: {
			player: 10,
			opponent: 7
		}
	},
	globalRanking: [
		{
			id: 2,
			position: 1,
			username: 'whaffman',
			rank: 2450,
			avatar: '/placeholders/avatars/whaffman.png'
		},
		{
			id: 5,
			position: 2,
			username: 'hesmolde',
			rank: 2350,
			avatar: '/placeholders/avatars/hesmolde.png'
		},
		{
			id: 4,
			position: 3,
			username: 'qbeukelm',
			rank: 2100,
			avatar: '/placeholders/avatars/qbeukelm.png'
		},
		{
			id: 3,
			position: 4,
			username: 'qmennen',
			rank: 1950,
			avatar: '/placeholders/avatars/qmennen.png'
		},
		{
			id: 6,
			position: 5,
			username: 'placeholder',
			rank: 1720,
			avatar: '/placeholders/avatars/placeholder.png'
		}
	],
	serverStatus: {
		name: 'Global Server',
		playersOnline: 12
	}
};
