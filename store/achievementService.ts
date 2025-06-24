import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement, ALL_ACHIEVEMENTS_LIST, AchievementProgress, getAchievementsWithProgress } from '../types/achievements';
import { AppStatistics, GameKey } from '../types/statistics';

const ACHIEVEMENT_STORAGE_KEY = 'Puzzleverse_AchievementProgress';

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const loadAchievementProgress = async (): Promise<AchievementProgress> => {
  try {
    const jsonValue = await AsyncStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    if (jsonValue != null) {
      const loadedProgress = JSON.parse(jsonValue) as AchievementProgress;
      let updatedProgress = { ...loadedProgress };
      let needsSave = false;
      for (const masterAch of ALL_ACHIEVEMENTS_LIST) {
        if (!updatedProgress[masterAch.id]) {
          updatedProgress[masterAch.id] = { isUnlocked: false, unlockedDate: undefined };
          needsSave = true;
        }
      }
      if (needsSave) {
        await saveAchievementProgress(updatedProgress);
      }
      return updatedProgress;
    } else {
      const initialProgress: AchievementProgress = {};
      ALL_ACHIEVEMENTS_LIST.forEach(ach => {
        initialProgress[ach.id] = { isUnlocked: false, unlockedDate: undefined };
      });
      await saveAchievementProgress(initialProgress);
      return initialProgress;
    }
  } catch (e) {
    console.error('Failed to load achievement progress.', e);
    const fallbackProgress: AchievementProgress = {};
    ALL_ACHIEVEMENTS_LIST.forEach(ach => { fallbackProgress[ach.id] = { isUnlocked: false, unlockedDate: undefined }; });
    return fallbackProgress;
  }
};

export const saveAchievementProgress = async (progress: AchievementProgress): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(progress);
    await AsyncStorage.setItem(ACHIEVEMENT_STORAGE_KEY, jsonValue);
    // console.log("Achievement progress saved."); // DEBUG
  } catch (e) {
    console.error('Failed to save achievement progress.', e);
  }
};

export const unlockAchievement = async (achievementId: string): Promise<Achievement | null> => {
  const progress = await loadAchievementProgress();
  const masterAchievement = ALL_ACHIEVEMENTS_LIST.find(ach => ach.id === achievementId);

  if (!masterAchievement) {
    console.warn(`Achievement with ID ${achievementId} not found in master list.`);
    return null;
  }

  if (!progress[achievementId] || !progress[achievementId].isUnlocked) {
    progress[achievementId] = {
      isUnlocked: true,
      unlockedDate: getTodayDateString(),
    };
    await saveAchievementProgress(progress);
    // console.log(`Achievement Unlocked: ${masterAchievement.name}`); // DEBUG
    return { ...masterAchievement, isUnlocked: true, unlockedDate: progress[achievementId].unlockedDate };
  }
  return null;
};

export const checkAndUnlockAchievements = async (
  stats: AppStatistics,
  gameKey?: GameKey,
  gameSpecificContext?: any
): Promise<Achievement[]> => {
  const newlyUnlocked: Achievement[] = [];
  const progress = await loadAchievementProgress();

  for (const masterAch of ALL_ACHIEVEMENTS_LIST) {
    if (progress[masterAch.id]?.isUnlocked) {
      continue;
    }

    let shouldUnlock = false;
    switch (masterAch.id) {
      case 'PG_SOLVED_1':
        if (stats[GameKey.PUZZLE_GRID] && stats[GameKey.PUZZLE_GRID]!.gamesWon >= 1) shouldUnlock = true;
        break;
      case 'PG_SOLVED_5':
        if (stats[GameKey.PUZZLE_GRID] && stats[GameKey.PUZZLE_GRID]!.gamesWon >= 5) shouldUnlock = true;
        break;
      case 'WW_WON_1':
        if (stats[GameKey.WORD_WISE] && stats[GameKey.WORD_WISE]!.gamesWon >= 1) shouldUnlock = true;
        break;
      case 'WW_WON_10':
        if (stats[GameKey.WORD_WISE] && stats[GameKey.WORD_WISE]!.gamesWon >= 10) shouldUnlock = true;
        break;
      case 'WW_DAILY_WIN_1':
        if (gameKey === GameKey.WORD_WISE && gameSpecificContext?.isDailyWin) shouldUnlock = true;
        break;
      case 'LL_PANGRAM_1':
        if (gameKey === GameKey.LETTER_LOGIC && gameSpecificContext?.pangramFound) shouldUnlock = true;
        break;
      case 'LL_SCORE_50':
        if (gameKey === GameKey.LETTER_LOGIC && gameSpecificContext?.scoreAchieved >= 50) shouldUnlock = true;
        break;
      case 'LU_PERFECT_1':
        if (gameKey === GameKey.LINK_UP && gameSpecificContext?.mistakesMade === 0 && gameSpecificContext?.didWin) shouldUnlock = true;
        break;
      case 'LU_SOLVED_3':
        if (stats[GameKey.LINK_UP] && stats[GameKey.LINK_UP]!.gamesWon >= 3) shouldUnlock = true;
        break;
      case 'IN_SOLVED_1':
        if (stats[GameKey.INSIGHT] && stats[GameKey.INSIGHT]!.gamesWon >= 1) shouldUnlock = true;
        break;
      case 'STREAK_3_DAYS':
        if (stats.currentStreak >= 3) shouldUnlock = true;
        break;
      case 'STREAK_7_DAYS':
        if (stats.currentStreak >= 7) shouldUnlock = true;
        break;
      case 'WW_VS_AI_WIN_ROCK':
        if (gameKey === GameKey.WORD_WISE && gameSpecificContext?.vsAI && gameSpecificContext?.opponentId === 'rock_bot' && gameSpecificContext?.didWin) shouldUnlock = true;
        break;
      case 'WW_VS_AI_WIN_LEXI':
         if (gameKey === GameKey.WORD_WISE && gameSpecificContext?.vsAI && gameSpecificContext?.opponentId === 'lexi_bot' && gameSpecificContext?.didWin) shouldUnlock = true;
        break;
    }

    if (shouldUnlock) {
      const unlockedAch = await unlockAchievement(masterAch.id);
      if (unlockedAch) {
        newlyUnlocked.push(unlockedAch);
      }
    }
  }
  if (newlyUnlocked.length > 0) {
    // console.log("Total newly unlocked achievements in this check:", newlyUnlocked.map(a=>a.name)); // DEBUG
  }
  return newlyUnlocked;
};

export const resetAchievementProgress = async (): Promise<AchievementProgress> => {
  const initialProgress: AchievementProgress = {};
  ALL_ACHIEVEMENTS_LIST.forEach(ach => {
    initialProgress[ach.id] = { isUnlocked: false, unlockedDate: undefined };
  });
  await saveAchievementProgress(initialProgress);
  // console.log("All achievement progress has been reset."); // DEBUG
  return initialProgress;
};

export const getAllAchievements = async (): Promise<Achievement[]> => {
    const progress = await loadAchievementProgress();
    return getAchievementsWithProgress(progress);
};

export { Achievement } from '../types/achievements';
