import { LinkUpPuzzle, LinkUpState, LinkUpItem, LinkUpCategory } from './types';
import { linkUpArchive2025 } from './archive/2025';

// Remove sampleLinkUpPuzzle and use a real puzzle from the archive
export function getTodayLinkUpPuzzle(): LinkUpPuzzle {
  const todayPuzzle = getLinkUpForDate(new Date());
  // Fallback to the first puzzle if today's isn't found
  return todayPuzzle || linkUpArchive2025[0];
}

export function initializeLinkUpState(puzzle: LinkUpPuzzle = getTodayLinkUpPuzzle(), maxMistakes: number = 4): LinkUpState {
  return {
    puzzle,
    selectedItems: [],
    foundCategories: [],
    mistakesMade: 0,
    maxMistakes,
    isGameOver: false,
    didWin: false,
    remainingItems: [...puzzle.items], // Start with all items
  };
}

export function toggleItemSelection(currentState: LinkUpState, item: LinkUpItem): LinkUpState {
  if (currentState.isGameOver) return currentState;

  const isSelected = currentState.selectedItems.find(i => i.id === item.id);
  let newSelectedItems;

  if (isSelected) {
    newSelectedItems = currentState.selectedItems.filter(i => i.id !== item.id);
  } else {
    if (currentState.selectedItems.length < currentState.puzzle.itemsPerGroup) {
      newSelectedItems = [...currentState.selectedItems, item];
    } else {
      // Already selected max items for a group, do nothing or provide feedback
      return currentState;
    }
  }
  return { ...currentState, selectedItems: newSelectedItems };
}

export function submitGroup(currentState: LinkUpState): LinkUpState {
  if (currentState.isGameOver || currentState.selectedItems.length !== currentState.puzzle.itemsPerGroup) {
    return currentState; // Can't submit if not enough items or game over
  }

  const { selectedItems, puzzle, foundCategories, remainingItems } = currentState;
  const firstItemCategoryId = selectedItems[0].categoryId;
  const isCorrectGroup = selectedItems.every(item => item.categoryId === firstItemCategoryId);

  if (isCorrectGroup) {
    const category = puzzle.categories.find(c => c.id === firstItemCategoryId);
    if (!category || foundCategories.some(fc => fc.categoryId === firstItemCategoryId)) {
        // Should not happen if data is consistent and category not already found
        return currentState;
    }

    const newFoundCategories = [...foundCategories, { categoryId: firstItemCategoryId, items: [...selectedItems] }];
    const newRemainingItems = remainingItems.filter(item => !selectedItems.some(sel => sel.id === item.id));
    const didWin = newFoundCategories.length === puzzle.categories.length;
    const isGameOver = didWin;

    return {
      ...currentState,
      foundCategories: newFoundCategories,
      selectedItems: [], // Clear selection
      remainingItems: newRemainingItems,
      isGameOver,
      didWin,
      // Optionally reset mistakes if a correct group is found, or keep them accumulating
    };
  } else {
    // Incorrect group
    const newMistakesMade = currentState.mistakesMade + 1;
    const isGameOver = newMistakesMade >= currentState.maxMistakes;
    const didWin = false; // Cannot win on a mistake

    return {
      ...currentState,
      mistakesMade: newMistakesMade,
      isGameOver,
      didWin,
      selectedItems: isGameOver ? currentState.selectedItems : [], // Clear selection if game not over
    };
  }
}

// Helper to check if an item is part of an already found category
export function isItemInFoundCategory(item: LinkUpItem, foundCategories: { categoryId: string; items: LinkUpItem[] }[]): boolean {
    return foundCategories.some(fc => fc.items.some(foundItem => foundItem.id === item.id));
}

export function getLinkUpForDate(date: Date) {
  const start = new Date(2025, 0, 1);
  const end = new Date(2025, 11, 31);
  if (date < start || date > end) return null;
  const index = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return linkUpArchive2025[index] || null;
}

export function getLinkUpArchiveUpToDate(date: Date) {
  const start = new Date(2025, 0, 1);
  if (date < start) return [];
  const index = Math.min(Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)), 364);
  return linkUpArchive2025.slice(0, index + 1);
}

// --- Game State Persistence ---
import AsyncStorage from '@react-native-async-storage/async-storage';

const LINK_UP_SAVE_KEY_PREFIX = 'LinkUp_SavedState_';

// Define what parts of the state to save.
// `puzzle` is not saved as it's part of the puzzle definition loaded by ID.
// `remainingItems` can be derived.
interface LinkUpSavedState {
  puzzleId: string;
  selectedItems: LinkUpItem[];
  foundCategories: { categoryId: string; items: LinkUpItem[] }[];
  mistakesMade: number;
  isGameOver: boolean;
  didWin: boolean;
}

export const saveLinkUpState = async (puzzleId: string, state: LinkUpState): Promise<void> => {
  if (state.isGameOver && state.didWin) { // Game won, clear saved state
    await AsyncStorage.removeItem(`${LINK_UP_SAVE_KEY_PREFIX}${puzzleId}`);
    // console.log(`Cleared saved state for completed Link Up puzzle: ${puzzleId}`);
    return;
  }

  // Avoid saving if no interaction yet, unless game is over (e.g. lost on first try)
  if (state.selectedItems.length === 0 && state.foundCategories.length === 0 && state.mistakesMade === 0 && !state.isGameOver) {
    // console.log(`No progress to save for Link Up puzzle: ${puzzleId}`);
    return;
  }

  try {
    const stateToSave: LinkUpSavedState = {
      puzzleId: puzzleId, // Or state.puzzle.id
      selectedItems: state.selectedItems,
      foundCategories: state.foundCategories,
      mistakesMade: state.mistakesMade,
      isGameOver: state.isGameOver,
      didWin: state.didWin,
    };
    const jsonValue = JSON.stringify(stateToSave);
    await AsyncStorage.setItem(`${LINK_UP_SAVE_KEY_PREFIX}${puzzleId}`, jsonValue);
    // console.log(`Link Up state saved for puzzle: ${puzzleId}`);
  } catch (e) {
    console.error('Failed to save Link Up state.', e);
  }
};

export const loadLinkUpState = async (puzzleId: string, currentPuzzleData: LinkUpPuzzle): Promise<LinkUpState | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(`${LINK_UP_SAVE_KEY_PREFIX}${puzzleId}`);
    if (jsonValue != null) {
      const saved: LinkUpSavedState = JSON.parse(jsonValue);

      if (saved.puzzleId !== puzzleId) {
        console.warn(`Loaded Link Up state for puzzle ${saved.puzzleId} but expected ${puzzleId}. Discarding.`);
        await AsyncStorage.removeItem(`${LINK_UP_SAVE_KEY_PREFIX}${puzzleId}`);
        return null;
      }

      // If game was saved as over but not won (i.e. lost), re-initialize but keep mistakes for display?
      // Or just let it load as game over. Current logic loads it as is.
      // If it was saved as "game over and won", it should have been cleared by saveLinkUpState.
      // If it's loaded as "game over and won", it means it wasn't cleared, so clear it now.
      if (saved.isGameOver && saved.didWin) {
        await AsyncStorage.removeItem(`${LINK_UP_SAVE_KEY_PREFIX}${puzzleId}`);
        return null; // Treat as no saved state, so game starts fresh
      }

      // console.log(`Loaded Link Up state for puzzle: ${puzzleId}`);
      // Reconstruct remainingItems based on foundCategories and all items in currentPuzzleData
      let remainingItems = [...currentPuzzleData.items];
      if (saved.foundCategories) {
        const foundItemIds = new Set<string>();
        saved.foundCategories.forEach(fc => fc.items.forEach(item => foundItemIds.add(item.id)));
        remainingItems = currentPuzzleData.items.filter(item => !foundItemIds.has(item.id));
      }

      const rehydratedState: LinkUpState = {
        puzzle: currentPuzzleData,
        selectedItems: saved.selectedItems || [],
        foundCategories: saved.foundCategories || [],
        mistakesMade: saved.mistakesMade || 0,
        maxMistakes: currentPuzzleData.maxMistakes || 4, // Get from puzzle data or default
        isGameOver: saved.isGameOver || false,
        didWin: saved.didWin || false,
        remainingItems,
      };
      return rehydratedState;
    }
  } catch (e) {
    console.error('Failed to load Link Up state.', e);
  }
  return null;
};
