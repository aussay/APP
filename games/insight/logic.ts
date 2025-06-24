import {
  InsightPuzzle,
  InsightGameState,
  UserGridState,
  LogicPuzzleCategory,
  LogicPuzzleClue,
  LogicPuzzleGridSolution,
} from './types';
import { insightArchive2025 } from './archive/2025';

export function getTodayInsightPuzzle(): InsightPuzzle {
  return insightArchive2025[0];
}

export function initializeInsightState(puzzle?: InsightPuzzle): InsightGameState {
  const usePuzzle = puzzle || getTodayInsightPuzzle();
  const initialGrid: UserGridState = {};
  usePuzzle.primaryCategoryItems.forEach(pItem => {
    initialGrid[pItem] = {};
    usePuzzle.categories.forEach(cat => {
      if (cat.id !== 'primary') {
        initialGrid[pItem][cat.id] = null;
      }
    });
  });
  return {
    puzzle: usePuzzle,
    userGrid: initialGrid,
    isComplete: false,
    score: 0,
    lastScoreChange: 0,
  };
}

// Called when a user makes an assignment in the grid
// e.g., user assigns 'Dog' as 'Pet' for 'Person 1'
export function updateUserGridCell(
  currentState: InsightGameState,
  primaryItem: string, // e.g., 'Person 1'
  categoryId: string, // e.g., 'pets'
  selectedItem: string | null // e.g., 'Dog' or null to clear
): InsightGameState {
  const newUserGrid = JSON.parse(JSON.stringify(currentState.userGrid)); // Deep copy

  // Basic validation: ensure items are valid for categories
  if (selectedItem) {
    const category = currentState.puzzle.categories.find(c => c.id === categoryId);
    if (!category || !category.items.includes(selectedItem)) {
      console.error(`Invalid item ${selectedItem} for category ${categoryId}`);
      return currentState; // Or handle error appropriately
    }
  }

  newUserGrid[primaryItem][categoryId] = selectedItem;

  // TODO: Add logic to check for contradictions based on clues or basic rules
  // (e.g., no two persons can have the same pet if pets are unique).
  // This is where the core of a real logic puzzle engine would reside.

  const isComplete = checkInsightCompletion(currentState.puzzle.solution, newUserGrid);

  return {
    ...currentState,
    userGrid: newUserGrid,
    isComplete,
  };
}

// Basic completion check against the predefined solution
export function checkInsightCompletion(
  solution: LogicPuzzleGridSolution,
  userGrid: UserGridState
): boolean {
  for (const pItem in solution) {
    if (!userGrid[pItem]) return false;
    for (const catId in solution[pItem]) {
      if (userGrid[pItem][catId] !== solution[pItem][catId]) {
        return false;
      }
    }
  }
  return true;
}

// Placeholder for a function that would validate the current grid against clues
// This would be very complex in a full implementation.
export function validateGridAgainstClues(
    userGrid: UserGridState,
    clues: LogicPuzzleClue[],
    categories: LogicPuzzleCategory[]
): { isValid: boolean; errors: string[] } {
    // For a prototype, this is a stub.
    // A real implementation would parse clues into logical constraints
    // and check if userGrid violates any.
    // Example constraint: "Alice owns a Dog."
    // Find which primaryItem is Alice, then check if their pet is Dog.
    // Or, if Alice is not yet assigned, ensure no other primaryItem has Dog if Alice is assigned to a primaryItem.
    return { isValid: true, errors: [] };
}

// --- Game State Persistence ---
import AsyncStorage from '@react-native-async-storage/async-storage';

const INSIGHT_SAVE_KEY_PREFIX = 'Insight_SavedState_';

interface InsightSavedState {
  puzzleId: string;
  userGrid: UserGridState;
  score: number;
}

export const saveInsightState = async (state: InsightGameState): Promise<void> => {
  if (state.isComplete) {
    await AsyncStorage.removeItem(`${INSIGHT_SAVE_KEY_PREFIX}${state.puzzle.id}`);
    console.log(`Cleared saved state for completed Insight puzzle: ${state.puzzle.id}`);
    return;
  }
  // Only save if there's some actual progress (e.g. at least one cell filled or score > 0)
  // This check can be more sophisticated based on what constitutes "progress".
  const hasProgress = Object.values(state.userGrid).some(row => Object.values(row).some(cell => cell !== null));
  if (!hasProgress && state.score === 0) {
    // await AsyncStorage.removeItem(`${INSIGHT_SAVE_KEY_PREFIX}${state.puzzle.id}`);
    // console.log(`No progress to save for Insight puzzle: ${state.puzzle.id}`);
    // return;
  }

  try {
    const stateToSave: InsightSavedState = {
      puzzleId: state.puzzle.id,
      userGrid: state.userGrid,
      score: state.score,
    };
    const jsonValue = JSON.stringify(stateToSave);
    await AsyncStorage.setItem(`${INSIGHT_SAVE_KEY_PREFIX}${state.puzzle.id}`, jsonValue);
    console.log(`Insight state saved for puzzle: ${state.puzzle.id}`);
  } catch (e) {
    console.error('Failed to save Insight state.', e);
  }
};

export const loadInsightState = async (puzzleId: string, currentPuzzleData: InsightPuzzle): Promise<InsightGameState | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(`${INSIGHT_SAVE_KEY_PREFIX}${puzzleId}`);
    if (jsonValue != null) {
      const saved: InsightSavedState = JSON.parse(jsonValue);
      if (saved.puzzleId !== puzzleId) {
        console.warn(`Loaded Insight state for puzzle ${saved.puzzleId} but expected ${puzzleId}. Discarding.`);
        await AsyncStorage.removeItem(`${INSIGHT_SAVE_KEY_PREFIX}${puzzleId}`);
        return null;
      }

      console.log(`Loaded Insight state for puzzle: ${puzzleId}`);
      // Reconstruct the full state
      return {
        puzzle: currentPuzzleData, // Use fresh puzzle data
        userGrid: saved.userGrid,
        score: saved.score,
        isComplete: checkInsightCompletion(currentPuzzleData.solution, saved.userGrid), // Re-check completion
        lastScoreChange: 0, // Transient
      };
    }
  } catch (e) {
    console.error('Failed to load Insight state.', e);
  }
  return null;
};

export const clearSavedInsightState = async (puzzleId: string): Promise<void> => {
    const key = `${INSIGHT_SAVE_KEY_PREFIX}${puzzleId}`;
    try {
        await AsyncStorage.removeItem(key);
        console.log(`Cleared Insight saved state for key: ${key}`);
    } catch (e) {
        console.error(`Failed to clear Insight state for key ${key}:`, e);
    }
};

// --- Archive Loader ---
export function getInsightForDate(date: Date) {
  const start = new Date(2025, 0, 1);
  const end = new Date(2025, 11, 31);
  if (date < start || date > end) return null;
  const index = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return insightArchive2025[index] || null;
}

export function getInsightArchiveUpToDate(date: Date) {
  const start = new Date(2025, 0, 1);
  if (date < start) return [];
  const index = Math.min(Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)), 364);
  return insightArchive2025.slice(0, index + 1);
}
