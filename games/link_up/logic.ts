import { LinkUpPuzzle, LinkUpState, LinkUpItem, LinkUpCategory } from './types';
import { linkUpArchive2025 } from './archive/2025';

// Remove sampleLinkUpPuzzle and use a real puzzle from the archive
export function getTodayLinkUpPuzzle(): LinkUpPuzzle {
  // For demo, use the first puzzle; in production, select by date
  return linkUpArchive2025[0];
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
