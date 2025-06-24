// Defines the structure for an achievement
export interface Achievement {
  id: string; // Unique identifier, e.g., 'PUZZLE_GRID_SOLVED_1'
  name: string; // Display name, e.g., "Grid Novice"
  description: string; // How to unlock it, e.g., "Solve your first Puzzle Grid."
  iconName: string; // Placeholder for badge image name, e.g., "badge_grid_novice.png" or an emoji
  isUnlocked: boolean;
  unlockedDate?: string; // ISO date string when unlocked
  category: 'puzzle_grid' | 'word_wise' | 'letter_logic' | 'link_up' | 'insight' | 'general' | 'ai'; // For grouping
  // Optional: Points or rewards associated with this achievement
  // rewardPoints?: number;
}

// List of all defined achievements in the game
// This will serve as the master list and initial state for locked achievements.
export const ALL_ACHIEVEMENTS_LIST: Achievement[] = [
  // Puzzle Grid
  { id: 'PG_SOLVED_1', name: 'Grid Beginner', description: 'Solve 1 Puzzle Grid.', iconName: '🏆', isUnlocked: false, category: 'puzzle_grid' },
  { id: 'PG_SOLVED_5', name: 'Grid Adept', description: 'Solve 5 Puzzle Grids.', iconName: '🏅', isUnlocked: false, category: 'puzzle_grid' },
  { id: 'PG_SOLVED_25', name: 'Grid Expert', description: 'Solve 25 Puzzle Grids.', iconName: '🌟', isUnlocked: false, category: 'puzzle_grid' },
  // Word Wise
  { id: 'WW_WON_1', name: 'Word Whiz Kid', description: 'Win 1 game of Word Wise.', iconName: '🧠', isUnlocked: false, category: 'word_wise' },
  { id: 'WW_WON_10', name: 'Word Wizard', description: 'Win 10 games of Word Wise.', iconName: '🧙', isUnlocked: false, category: 'word_wise' },
  { id: 'WW_WON_50', name: 'Lexical Legend', description: 'Win 50 games of Word Wise.', iconName: '📜', isUnlocked: false, category: 'word_wise' },
  { id: 'WW_DAILY_WIN_1', name: 'Daily Dabbler', description: 'Win 1 Word Wise Daily Challenge.', iconName: '📅', isUnlocked: false, category: 'word_wise'},
  { id: 'WW_DAILY_WIN_7', name: 'Daily Devotee', description: 'Win 7 Word Wise Daily Challenges.', iconName: '🗓️', isUnlocked: false, category: 'word_wise'},
  // Letter Logic
  { id: 'LL_PANGRAM_1', name: 'Pangram Pathfinder', description: 'Find your first pangram in Letter Logic.', iconName: '🌟', isUnlocked: false, category: 'letter_logic' },
  { id: 'LL_PANGRAM_5', name: 'Pangram Pro', description: 'Find 5 pangrams in Letter Logic.', iconName: '✨', isUnlocked: false, category: 'letter_logic' },
  { id: 'LL_SCORE_50', name: 'Word Collector', description: 'Score 50 points in a single game of Letter Logic.', iconName: '📚', isUnlocked: false, category: 'letter_logic' },
  { id: 'LL_SCORE_100', name: 'Lexicon Leader', description: 'Score 100 points in a single game of Letter Logic.', iconName: '👑', isUnlocked: false, category: 'letter_logic' },
  // Link Up
  { id: 'LU_PERFECT_1', name: 'Perfect Linker', description: 'Solve a Link Up puzzle with no mistakes.', iconName: '🔗', isUnlocked: false, category: 'link_up' },
  { id: 'LU_SOLVED_3', name: 'Group Guru', description: 'Solve 3 Link Up puzzles.', iconName: '🧩', isUnlocked: false, category: 'link_up' },
  { id: 'LU_SOLVED_10', name: 'Connection Connoisseur', description: 'Solve 10 Link Up puzzles.', iconName: '🌐', isUnlocked: false, category: 'link_up' },
  // Insight
  { id: 'IN_SOLVED_1', name: 'Insightful Start', description: 'Solve your first Insight puzzle.', iconName: '💡', isUnlocked: false, category: 'insight' },
  { id: 'IN_SOLVED_5', name: 'Deduction Devotee', description: 'Solve 5 Insight puzzles.', iconName: '🕵️', isUnlocked: false, category: 'insight' },
  // General / Streaks
  { id: 'STREAK_3_DAYS', name: 'Consistent Player', description: 'Achieve a 3-day daily play streak.', iconName: '🔥', isUnlocked: false, category: 'general' },
  { id: 'STREAK_7_DAYS', name: 'Dedicated Puzzler', description: 'Achieve a 7-day daily play streak.', iconName: '🌟', isUnlocked: false, category: 'general' }, // Changed icon from 🔥🔥🔥
  { id: 'STREAK_30_DAYS', name: 'Puzzle Loyalist', description: 'Achieve a 30-day daily play streak.', iconName: '💎', isUnlocked: false, category: 'general' },
  { id: 'TOTAL_GAMES_25', name: 'Puzzle Enthusiast', description: 'Play 25 total games across all modes.', iconName: '🎲', isUnlocked: false, category: 'general'},
  { id: 'TOTAL_GAMES_100', name: 'Puzzle Veteran', description: 'Play 100 total games across all modes.', iconName: '🛡️', isUnlocked: false, category: 'general'},
  // Versus AI (Word Wise)
  { id: 'WW_VS_AI_WIN_ROCK', name: 'Rock Crusher', description: 'Defeat Rock in Word Wise Versus AI.', iconName: '🗿', isUnlocked: false, category: 'word_wise' },
  { id: 'WW_VS_AI_WIN_LEXI', name: 'Logic Defier', description: 'Defeat Lexi in Word Wise Versus AI.', iconName: '🤖', isUnlocked: false, category: 'word_wise' },
  { id: 'WW_VS_AI_WIN_RANDY', name: 'Luck Tamer', description: 'Defeat Random Randy in Word Wise Versus AI.', iconName: '🍀', isUnlocked: false, category: 'word_wise' },
];

// Type for storing achievement progress (just the unlocked status and date)
export type AchievementProgress = {
  [achievementId: string]: {
    isUnlocked: boolean;
    unlockedDate?: string;
  };
};

// Helper to get full achievement details by merging progress with master list
export const getAchievementsWithProgress = (progress: AchievementProgress): Achievement[] => {
    return ALL_ACHIEVEMENTS_LIST.map(masterAch => {
        const prog = progress[masterAch.id];
        if (prog) {
            return { ...masterAch, isUnlocked: prog.isUnlocked, unlockedDate: prog.unlockedDate };
        }
        return { ...masterAch }; // Default to master list if no progress saved (shouldn't happen if initialized correctly)
    });
};
