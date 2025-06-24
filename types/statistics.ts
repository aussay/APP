export enum GameKey {
  PUZZLE_GRID = 'puzzle_grid',
  WORD_WISE = 'word_wise',
  LETTER_LOGIC = 'letter_logic',
  LINK_UP = 'link_up',
  INSIGHT = 'insight',
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  totalSolveTime: number; // in seconds
  gamesCompletedForTimeStats: number; // Count of games that contributed to totalSolveTime
  // We can add more detailed stats later, like bestScore, winStreak, etc.
}

export type AppStatistics = {
  [key in GameKey]?: GameStats;
} & {
  totalGamesPlayed: number;
  currentStreak: number;
  longestStreak: number;
  lastStreakUpdateDate: string | null;
  puzzleGridStreak: number;
  wordWiseStreak: number;
  letterLogicStreak: number;
  linkUpStreak: number;
  insightStreak: number;
  // Per-game last streak update dates
  puzzleGridLastStreakDate: string | null;
  wordWiseLastStreakDate: string | null;
  letterLogicLastStreakDate: string | null;
  linkUpLastStreakDate: string | null;
  insightLastStreakDate: string | null;
  dailyStreakHistory?: number[];
};

// Default structure for a single game's stats
export const defaultGameStats: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  totalSolveTime: 0,
  gamesCompletedForTimeStats: 0,
};

// Initial structure for all app statistics
export const initialAppStatistics: AppStatistics = {
  [GameKey.PUZZLE_GRID]: { ...defaultGameStats },
  [GameKey.WORD_WISE]: { ...defaultGameStats },
  [GameKey.LETTER_LOGIC]: { ...defaultGameStats },
  [GameKey.LINK_UP]: { ...defaultGameStats },
  [GameKey.INSIGHT]: { ...defaultGameStats },
  totalGamesPlayed: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastStreakUpdateDate: null,
  puzzleGridStreak: 0,
  wordWiseStreak: 0,
  letterLogicStreak: 0,
  linkUpStreak: 0,
  insightStreak: 0,
  puzzleGridLastStreakDate: null,
  wordWiseLastStreakDate: null,
  letterLogicLastStreakDate: null,
  linkUpLastStreakDate: null,
  insightLastStreakDate: null,
  dailyStreakHistory: undefined,
};
