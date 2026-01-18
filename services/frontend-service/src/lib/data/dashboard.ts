import type { DashboardData } from '$lib/types/types';

// Mock dashboard data - will be replaced with actual API calls
export const mockDashboardData: DashboardData = {
	currentUser: {
		username: 'fras',
		avatar: '/placeholders/avatars/fras.png',
		rank: 1240,
		position: 42
	},
	lastMatch: {
		opponent: 'hesmolde',
		result: 'WIN'
	},
	globalRanking: [
		{
			position: 1,
			username: 'whaffman',
			rank: 2450,
			avatar: '/placeholders/avatars/whaffman.png'
		},
		{
			position: 2,
			username: 'hesmolde',
			rank: 2350,
			avatar: '/placeholders/avatars/hesmolde.png'
		},
		{
			position: 3,
			username: 'qbeukelm',
			rank: 2100,
			avatar: '/placeholders/avatars/qbeukelm.png'
		},
		{
			position: 4,
			username: 'qmennen',
			rank: 1950,
			avatar: '/placeholders/avatars/qmennen.png'
		},
		{
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
