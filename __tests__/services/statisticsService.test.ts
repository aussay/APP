import AsyncStorageMock from '@react-native-async-storage/async-storage';
import {
  loadStatistics,
  saveStatistics,
  resetStatistics,
  finalizeGameSession,
  updateDailyStreak,
  markDailyChallengeCompleted,
  hasDailyChallengeBeenCompleted,
  // updateGameStreak, // Not testing this one for brevity, similar logic to updateDailyStreak
} from '../../store/statisticsService'; // Adjust path
import { AppStatistics, GameKey, initialAppStatistics, defaultGameStats } from '../../types/statistics';

const STATS_STORAGE_KEY = 'Puzzleverse_AppStatistics';
const DAILY_CHALLENGE_COMPLETED_PREFIX = 'Puzzleverse_DailyChallengeCompleted_';

// Mock achievementService to prevent errors from require('./achievementService')
jest.mock('../../store/achievementService', () => ({
  checkAndUnlockAchievements: jest.fn().mockResolvedValue([]),
  resetAchievementProgress: jest.fn().mockResolvedValue(undefined),
}));


describe('statisticsService', () => {
  beforeEach(() => {
    (AsyncStorageMock as any).__clearStore();
    jest.clearAllMocks();
  });

  describe('loadStatistics', () => {
    it('should return initialAppStatistics and save them if no stats are stored', async () => {
      const stats = await loadStatistics();
      expect(stats).toEqual(initialAppStatistics);
      expect(AsyncStorageMock.setItem).toHaveBeenCalledWith(STATS_STORAGE_KEY, JSON.stringify(initialAppStatistics));
    });

    it('should return stored statistics if they exist and are valid', async () => {
      const storedStats: AppStatistics = {
        ...initialAppStatistics,
        totalGamesPlayed: 10,
        [GameKey.WORD_WISE]: { ...defaultGameStats, gamesPlayed: 5, gamesWon: 2, totalSolveTime: 120, gamesCompletedForTimeStats: 2 },
      };
      await AsyncStorageMock.setItem(STATS_STORAGE_KEY, JSON.stringify(storedStats));
      const stats = await loadStatistics();
      expect(stats).toEqual(storedStats);
    });

    it('should perform data migration for missing game keys', async () => {
      const partialStats = { ...initialAppStatistics };
      delete (partialStats as any)[GameKey.LETTER_LOGIC]; // Remove one game key
      await AsyncStorageMock.setItem(STATS_STORAGE_KEY, JSON.stringify(partialStats));

      const stats = await loadStatistics();
      expect(stats[GameKey.LETTER_LOGIC]).toEqual(defaultGameStats);
      expect(AsyncStorageMock.setItem).toHaveBeenCalled(); // Migration should trigger a save
    });

    it('should perform data migration for missing streak fields', async () => {
        const oldStats = { ...initialAppStatistics };
        delete oldStats.currentStreak; // Simulate old structure
        await AsyncStorageMock.setItem(STATS_STORAGE_KEY, JSON.stringify(oldStats));

        const stats = await loadStatistics();
        expect(stats.currentStreak).toBe(0);
        expect(AsyncStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle corrupted JSON by returning initial stats and logging error', async () => {
      await AsyncStorageMock.setItem(STATS_STORAGE_KEY, 'corrupted_json_data');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const stats = await loadStatistics();
      // It should return a fully formed initialAppStatistics object, even if base was corrupted
      expect(stats).toEqual(expect.objectContaining(initialAppStatistics));
      Object.values(GameKey).forEach(gk => {
        expect(stats[gk]).toBeDefined();
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load statistics.', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should handle AsyncStorage.getItem failure by returning initial stats and logging error', async () => {
      AsyncStorageMock.getItem = jest.fn().mockRejectedValueOnce(new Error('AsyncStorage GET failed'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const stats = await loadStatistics();
      expect(stats).toEqual(expect.objectContaining(initialAppStatistics));
      Object.values(GameKey).forEach(gk => {
        expect(stats[gk]).toBeDefined();
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load statistics.', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('saveStatistics', () => {
    it('should save the statistics to AsyncStorage', async () => {
      const statsToSave: AppStatistics = { ...initialAppStatistics, totalGamesPlayed: 5 };
      await saveStatistics(statsToSave);
      expect(AsyncStorageMock.setItem).toHaveBeenCalledWith(STATS_STORAGE_KEY, JSON.stringify(statsToSave));
      expect((AsyncStorageMock as any).__getStore()[STATS_STORAGE_KEY]).toBe(JSON.stringify(statsToSave));
    });

    it('should log error if AsyncStorage.setItem fails', async () => {
        AsyncStorageMock.setItem = jest.fn().mockRejectedValueOnce(new Error('AsyncStorage SET failed'));
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await saveStatistics(initialAppStatistics);
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to save statistics.", expect.any(Error));
        consoleErrorSpy.mockRestore();
    });
  });

  describe('resetStatistics', () => {
    it('should save initialAppStatistics and call achievement reset', async () => {
      const { resetAchievementProgress } = require('../../store/achievementService');
      await resetStatistics();
      expect(AsyncStorageMock.setItem).toHaveBeenCalledWith(STATS_STORAGE_KEY, JSON.stringify(initialAppStatistics));
      expect((AsyncStorageMock as any).__getStore()[STATS_STORAGE_KEY]).toBe(JSON.stringify(initialAppStatistics));
      expect(resetAchievementProgress).toHaveBeenCalled();
    });
  });

  describe('finalizeGameSession', () => {
    const gameKey = GameKey.WORD_WISE;

    it('should update stats correctly for a won game with solve time', async () => {
      await saveStatistics(initialAppStatistics); // Start with initial stats
      const solveTime = 120;

      const result = await finalizeGameSession(gameKey, true, solveTime);

      expect(result[gameKey]?.gamesPlayed).toBe(1);
      expect(result[gameKey]?.gamesWon).toBe(1);
      expect(result[gameKey]?.totalSolveTime).toBe(solveTime);
      expect(result[gameKey]?.gamesCompletedForTimeStats).toBe(1);
      expect(result.totalGamesPlayed).toBe(1);
      expect(AsyncStorageMock.setItem).toHaveBeenCalledTimes(2); // initial save + finalizeGameSession save

      const { checkAndUnlockAchievements } = require('../../store/achievementService');
      expect(checkAndUnlockAchievements).toHaveBeenCalled();
    });

    it('should update stats correctly for a lost game', async () => {
      await saveStatistics(initialAppStatistics);
      const result = await finalizeGameSession(gameKey, false);

      expect(result[gameKey]?.gamesPlayed).toBe(1);
      expect(result[gameKey]?.gamesWon).toBe(0);
      expect(result.totalGamesPlayed).toBe(1);
    });
  });

  describe('updateDailyStreak', () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${(yesterday.getMonth() + 1).toString().padStart(2, '0')}-${yesterday.getDate().toString().padStart(2, '0')}`;

    const dayBeforeYesterday = new Date();
    dayBeforeYesterday.setDate(today.getDate() - 2);
    const dayBeforeYesterdayStr = `${dayBeforeYesterday.getFullYear()}-${(dayBeforeYesterday.getMonth() + 1).toString().padStart(2, '0')}-${dayBeforeYesterday.getDate().toString().padStart(2, '0')}`;


    it('should not change streak if last update was today', async () => {
        const currentStats: AppStatistics = { ...initialAppStatistics, currentStreak: 5, lastStreakUpdateDate: todayStr };
        await saveStatistics(currentStats);
        const result = await updateDailyStreak();
        expect(result.currentStreak).toBe(5);
    });

    it('should increment streak if last update was yesterday', async () => {
        const currentStats: AppStatistics = { ...initialAppStatistics, currentStreak: 5, longestStreak: 5, lastStreakUpdateDate: yesterdayStr };
        await saveStatistics(currentStats);
        const result = await updateDailyStreak();
        expect(result.currentStreak).toBe(6);
        expect(result.longestStreak).toBe(6);
        expect(result.lastStreakUpdateDate).toBe(todayStr);
    });

    it('should reset streak to 1 if last update was before yesterday', async () => {
        const currentStats: AppStatistics = { ...initialAppStatistics, currentStreak: 5, longestStreak: 5, lastStreakUpdateDate: dayBeforeYesterdayStr };
        await saveStatistics(currentStats);
        const result = await updateDailyStreak();
        expect(result.currentStreak).toBe(1);
        expect(result.longestStreak).toBe(5); // Longest should remain
        expect(result.lastStreakUpdateDate).toBe(todayStr);
    });
  });

  describe('Daily Challenge Tracking', () => {
    const challengeKey = "2024-01-01_word_wise";
    it('markDailyChallengeCompleted should store the key', async () => {
        await markDailyChallengeCompleted(challengeKey);
        expect(AsyncStorageMock.setItem).toHaveBeenCalledWith(`${DAILY_CHALLENGE_COMPLETED_PREFIX}${challengeKey}`, 'true');
    });

    it('hasDailyChallengeBeenCompleted should return true if marked', async () => {
        await AsyncStorageMock.setItem(`${DAILY_CHALLENGE_COMPLETED_PREFIX}${challengeKey}`, 'true');
        const completed = await hasDailyChallengeBeenCompleted(challengeKey);
        expect(completed).toBe(true);
    });

    it('hasDailyChallengeBeenCompleted should return false if not marked', async () => {
        const completed = await hasDailyChallengeBeenCompleted(challengeKey);
        expect(completed).toBe(false);
    });
  });

});
