interface LeaderboardPlayer {
  id: number;
  username: string;
  elo: number;
  avatar: string;
}

// Placeholder leaderboard data
// This will be replaced with backend API calls later
export const leaderboardData: LeaderboardPlayer[] = [
  {
    id: 1,
    username: 'fras',
    elo: 2450,
    avatar: '/placeholders/avatars/fras.png',
  },
  {
    id: 2,
    username: 'whaffman',
    elo: 2450,
    avatar: '/placeholders/avatars/whaffman.png',
  },
  {
    id: 3,
    username: 'qmennen',
    elo: 1985,
    avatar: '/placeholders/avatars/qmennen.png',
  },
  {
    id: 4,
    username: 'qbeukelm',
    elo: 1786,
    avatar: '/placeholders/avatars/qbeukelm.png',
  },
  {
    id: 5,
    username: 'hesmolde',
    elo: 1777,
    avatar: '/placeholders/avatars/hesmolde.png',
  },
];
