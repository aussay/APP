import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppStatistics, GameKey, initialAppStatistics, defaultGameStats } from '../types/statistics';
import { Achievement } from '../types/achievements'; // Import Achievement type

const STATS_STORAGE_KEY = 'Puzzleverse_AppStatistics';

// Extended type for service return values that include unlocked achievements
export type StatsUpdateResult = AppStatistics & { unlockedAchievements?: Achievement[] };

export const loadStatistics = async (): Promise<AppStatistics> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STATS_STORAGE_KEY);
    if (jsonValue != null) {
      const storedStats: AppStatistics = JSON.parse(jsonValue);
      let needsUpdate = false;
      Object.values(GameKey).forEach(gameKey => {
        if (!storedStats[gameKey]) {
          storedStats[gameKey] = { ...defaultGameStats };
          needsUpdate = true;
        } else {
          if (typeof storedStats[gameKey]!.totalSolveTime === 'undefined') {
            storedStats[gameKey]!.totalSolveTime = 0;
            needsUpdate = true;
          }
          if (typeof storedStats[gameKey]!.gamesCompletedForTimeStats === 'undefined') {
            storedStats[gameKey]!.gamesCompletedForTimeStats = 0;
            needsUpdate = true;
          }
        }
      });
      if (typeof storedStats.currentStreak === 'undefined') { storedStats.currentStreak = 0; needsUpdate = true; }
      if (typeof storedStats.longestStreak === 'undefined') { storedStats.longestStreak = 0; needsUpdate = true; }
      if (typeof storedStats.lastStreakUpdateDate === 'undefined') { storedStats.lastStreakUpdateDate = null; needsUpdate = true; }
      if (typeof storedStats.totalGamesPlayed !== 'number' || isNaN(storedStats.totalGamesPlayed)) {
        storedStats.totalGamesPlayed = 0;
        Object.values(GameKey).forEach(gk => {
            if(storedStats[gk] && typeof storedStats[gk]!.gamesPlayed === 'number') {
                 storedStats.totalGamesPlayed += storedStats[gk]!.gamesPlayed;
            }
        });
        needsUpdate = true;
      }
      if (typeof storedStats.puzzleGridStreak === 'undefined') { storedStats.puzzleGridStreak = 0; needsUpdate = true; }
      if (typeof storedStats.wordWiseStreak === 'undefined') { storedStats.wordWiseStreak = 0; needsUpdate = true; }
      if (typeof storedStats.letterLogicStreak === 'undefined') { storedStats.letterLogicStreak = 0; needsUpdate = true; }
      if (typeof storedStats.linkUpStreak === 'undefined') { storedStats.linkUpStreak = 0; needsUpdate = true; }
      if (typeof storedStats.insightStreak === 'undefined') { storedStats.insightStreak = 0; needsUpdate = true; }
      if (needsUpdate) {
        await saveStatistics(storedStats);
      }
      return storedStats;
    } else {
      await saveStatistics(initialAppStatistics);
      return { ...initialAppStatistics };
    }
  } catch (e) {
    console.error('Failed to load statistics.', e);
    const fallbackStats = { ...initialAppStatistics };
    Object.values(GameKey).forEach(gameKey => {
        if(!fallbackStats[gameKey]) fallbackStats[gameKey] = { ...defaultGameStats };
    });
    return fallbackStats;
  }
};

export const saveStatistics = async (stats: AppStatistics): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(stats);
    await AsyncStorage.setItem(STATS_STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error('Failed to save statistics.', e);
  }
};

export const finalizeGameSession = async (
  gameKey: GameKey,
  didWin: boolean,
  solveTimeInSeconds?: number
): Promise<StatsUpdateResult> => { // Return type updated
    let currentStats = await loadStatistics();
    let unlockedAchievements: Achievement[] = [];

    if (!currentStats[gameKey]) {
        currentStats[gameKey] = { ...defaultGameStats };
    }
    const gameStats = currentStats[gameKey]!;

    gameStats.gamesPlayed += 1;
    currentStats.totalGamesPlayed = (currentStats.totalGamesPlayed || 0) + 1;

    if (didWin) {
        gameStats.gamesWon += 1;
        if (typeof solveTimeInSeconds === 'number' && solveTimeInSeconds > 0) {
            gameStats.totalSolveTime = (gameStats.totalSolveTime || 0) + solveTimeInSeconds;
            gameStats.gamesCompletedForTimeStats = (gameStats.gamesCompletedForTimeStats || 0) + 1;
        }
    }
    await saveStatistics(currentStats);

    const { checkAndUnlockAchievements } = require('./achievementService');
    if (checkAndUnlockAchievements) {
      const achievementContext: any = { didWin };
      if (didWin && typeof solveTimeInSeconds === 'number') {
        achievementContext.solveTimeInSeconds = solveTimeInSeconds;
      }
      unlockedAchievements = await checkAndUnlockAchievements(currentStats, gameKey, achievementContext);
      if (unlockedAchievements.length > 0) {
        // console.log(`${gameKey} achievements unlocked via finalizeGameSession:`, unlockedAchievements.map(a => a.name)); // DEBUG
      }
    }
    return { ...currentStats, unlockedAchievements };
};

export const resetStatistics = async (): Promise<AppStatistics> => {
  await saveStatistics(initialAppStatistics);
  // Also reset achievement progress when resetting stats
  const { resetAchievementProgress } = require('./achievementService');
  if (resetAchievementProgress) {
    await resetAchievementProgress();
  }
  return { ...initialAppStatistics };
};

const DAILY_CHALLENGE_COMPLETED_PREFIX = 'Puzzleverse_DailyChallengeCompleted_';

export const markDailyChallengeCompleted = async (challengeKey: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(`${DAILY_CHALLENGE_COMPLETED_PREFIX}${challengeKey}`, 'true');
  } catch (e) {
    console.error('Failed to mark daily challenge as completed.', e);
  }
};

export const hasDailyChallengeBeenCompleted = async (challengeKey: string): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(`${DAILY_CHALLENGE_COMPLETED_PREFIX}${challengeKey}`);
    return value === 'true';
  } catch (e) {
    console.error('Failed to check daily challenge completion status.', e);
    return false;
  }
};

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayDateString = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = (yesterday.getMonth() + 1).toString().padStart(2, '0');
  const day = yesterday.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const updateDailyStreak = async (): Promise<StatsUpdateResult> => { // Return type updated
  let stats = await loadStatistics();
  const todayStr = getTodayDateString();
  let unlockedAchievements: Achievement[] = [];

  if (stats.lastStreakUpdateDate === todayStr) {
    return { ...stats, unlockedAchievements };
  }

  const yesterdayStr = getYesterdayDateString();
  if (stats.lastStreakUpdateDate === yesterdayStr) {
    stats.currentStreak += 1;
  } else {
    stats.currentStreak = 1;
  }
  if (stats.currentStreak > stats.longestStreak) {
    stats.longestStreak = stats.currentStreak;
  }
  stats.lastStreakUpdateDate = todayStr;
  await saveStatistics(stats);

  const { checkAndUnlockAchievements } = require('./achievementService');
  if (checkAndUnlockAchievements) {
    unlockedAchievements = await checkAndUnlockAchievements(stats, undefined, { isStreakUpdate: true });
    if (unlockedAchievements.length > 0) {
      // console.log("Streak achievements unlocked via updateDailyStreak:", unlockedAchievements.map(a => a.name)); // DEBUG
    }
  }
  return { ...stats, unlockedAchievements };
};

// Utility to map GameKey to streak and last streak date fields
const gameStreakFieldMap = {
  [GameKey.PUZZLE_GRID]: {
    streak: 'puzzleGridStreak',
    lastDate: 'puzzleGridLastStreakDate',
  },
  [GameKey.WORD_WISE]: {
    streak: 'wordWiseStreak',
    lastDate: 'wordWiseLastStreakDate',
  },
  [GameKey.LETTER_LOGIC]: {
    streak: 'letterLogicStreak',
    lastDate: 'letterLogicLastStreakDate',
  },
  [GameKey.LINK_UP]: {
    streak: 'linkUpStreak',
    lastDate: 'linkUpLastStreakDate',
  },
  [GameKey.INSIGHT]: {
    streak: 'insightStreak',
    lastDate: 'insightLastStreakDate',
  },
};

export const updateGameStreak = async (gameKey: GameKey): Promise<StatsUpdateResult> => {
  let stats = await loadStatistics();
  const todayStr = getTodayDateString();
  let unlockedAchievements: Achievement[] = [];
  const { streak, lastDate } = gameStreakFieldMap[gameKey];
  const lastStreakDate = (stats as any)[lastDate] as string | null;
  if (lastStreakDate === todayStr) {
    return { ...stats, unlockedAchievements };
  }
  const yesterdayStr = getYesterdayDateString();
  if (lastStreakDate === yesterdayStr) {
    (stats as any)[streak] = ((stats as any)[streak] || 0) + 1;
  } else {
    (stats as any)[streak] = 1;
  }
  (stats as any)[lastDate] = todayStr;
  await saveStatistics(stats);
  // Optionally unlock achievements here in the future
  return { ...stats, unlockedAchievements };
};
