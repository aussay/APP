import { LetterLogicPuzzle, LetterLogicState } from './types';
import { letterLogicArchive2025 } from './archive/2025';

// Remove sampleLetterLogicPuzzle and use a real puzzle from the archive
export function getTodayLetterLogicPuzzle(): LetterLogicPuzzle {
  const todayPuzzle = getLetterLogicForDate(new Date());
  // Fallback to the first puzzle if today's isn't found (e.g., archive incomplete or date issue)
  return todayPuzzle || letterLogicArchive2025[0];
}

export function initializeLetterLogicState(puzzle: LetterLogicPuzzle = getTodayLetterLogicPuzzle()): LetterLogicState {
  return {
    puzzle,
    foundWords: [],
    currentInput: '',
    score: 0,
    lastScoreChange: 0,
  };
}

export function addLetterToInput(currentState: LetterLogicState, letter: string): LetterLogicState {
  // Ensure letter is one of the available puzzle letters
  if (currentState.puzzle.letters.includes(letter.toUpperCase())) {
    return {
      ...currentState,
      currentInput: currentState.currentInput + letter.toUpperCase(),
    };
  }
  return currentState;
}

export function removeLastLetterFromInput(currentState: LetterLogicState): LetterLogicState {
  if (currentState.currentInput.length > 0) {
    return {
      ...currentState,
      currentInput: currentState.currentInput.slice(0, -1),
    };
  }
  return currentState;
}

export function shuffleInputLetters(currentState: LetterLogicState): LetterLogicState {
    // This function is more about the UI presentation of available letters,
    // but we can include a conceptual placeholder if needed or handle it purely in UI.
    // For now, let's assume the main letters array in the puzzle data could be shuffled
    // by the UI. If the `letters` array itself needs to be part of the state and shuffleable:
    const shuffledLetters = [...currentState.puzzle.letters].sort(() => Math.random() - 0.5);
    return {
        ...currentState,
        puzzle: {
            ...currentState.puzzle,
            letters: shuffledLetters,
        }
    };
}


export function submitWord(currentState: LetterLogicState): LetterLogicState {
  const { puzzle, currentInput, foundWords } = currentState;
  let newScore = currentState.score;

  if (currentInput.length < puzzle.minWordLength) {
    // Word too short
    return { ...currentState, currentInput: '' /* Optionally provide feedback */ };
  }
  if (!currentInput.includes(puzzle.centerLetter)) {
    // Missing center letter
    return { ...currentState, currentInput: '' /* Optionally provide feedback */ };
  }
  if (foundWords.includes(currentInput)) {
    // Already found
    return { ...currentState, currentInput: '' /* Optionally provide feedback */ };
  }
  if (!puzzle.validWords.includes(currentInput)) {
    // Not in word list
    return { ...currentState, currentInput: '' /* Optionally provide feedback */ };
  }

  // Valid word found
  const newFoundWords = [...foundWords, currentInput];

  // Scoring logic (example)
  if (currentInput.length === 4) {
    newScore += 1;
  } else if (currentInput.length > 4) {
    newScore += currentInput.length;
  }
  if (puzzle.pangrams.includes(currentInput)) {
    newScore += 7; // Bonus for pangram
  }

  return {
    ...currentState,
    foundWords: newFoundWords,
    score: newScore,
    currentInput: '',
  };
}

// Helper to check if all letters in a word are from the allowed set
export function usesOnlyAvailableLetters(word: string, availableLetters: string[]): boolean {
    const availableSet = new Set(availableLetters);
    for (const char of word) {
        if (!availableSet.has(char)) {
            return false;
        }
    }
    return true;
}

export function getLetterLogicForDate(date: Date) {
  const start = new Date(2025, 0, 1);
  const end = new Date(2025, 11, 31);
  if (date < start || date > end) return null;
  const index = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return letterLogicArchive2025[index] || null;
}

export function getLetterLogicArchiveUpToDate(date: Date) {
  const start = new Date(2025, 0, 1);
  if (date < start) return [];
  const index = Math.min(Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)), 364);
  return letterLogicArchive2025.slice(0, index + 1);
}

// --- Game State Persistence ---
import AsyncStorage from '@react-native-async-storage/async-storage';

const LETTER_LOGIC_SAVE_KEY_PREFIX = 'LetterLogic_SavedState_';

interface LetterLogicSavedState {
  puzzleId: string; // To identify which puzzle this state belongs to
  foundWords: string[];
  currentInput: string;
  score: number;
}

export const saveLetterLogicState = async (puzzleId: string, state: LetterLogicState): Promise<void> => {
  // Don't save if all words are found (game is complete)
  if (state.foundWords.length === state.puzzle.validWords.length) {
    await AsyncStorage.removeItem(`${LETTER_LOGIC_SAVE_KEY_PREFIX}${puzzleId}`);
    console.log(`Cleared saved state for completed Letter Logic puzzle: ${puzzleId}`);
    return;
  }

  // Only save if there's some progress
  if (state.foundWords.length === 0 && state.currentInput === '' && state.score === 0) {
    // console.log(`No progress to save for Letter Logic puzzle: ${puzzleId}`); // Optional: avoid saving empty states
    // await AsyncStorage.removeItem(`${LETTER_LOGIC_SAVE_KEY_PREFIX}${puzzleId}`); // Or clear if it exists
    return;
  }

  try {
    const stateToSave: LetterLogicSavedState = {
      puzzleId: puzzleId, // Or state.puzzle.id if available and consistent
      foundWords: state.foundWords,
      currentInput: state.currentInput,
      score: state.score,
    };
    const jsonValue = JSON.stringify(stateToSave);
    await AsyncStorage.setItem(`${LETTER_LOGIC_SAVE_KEY_PREFIX}${puzzleId}`, jsonValue);
    // console.log(`Letter Logic state saved for puzzle: ${puzzleId}`);
  } catch (e) {
    console.error('Failed to save Letter Logic state.', e);
  }
};

export const loadLetterLogicState = async (puzzleId: string, currentPuzzleData: LetterLogicPuzzle): Promise<LetterLogicState | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(`${LETTER_LOGIC_SAVE_KEY_PREFIX}${puzzleId}`);
    if (jsonValue != null) {
      const saved: LetterLogicSavedState = JSON.parse(jsonValue);

      // Basic validation: if the saved puzzleId doesn't match, or if the puzzle structure fundamentally changed, invalidate.
      // For this game, puzzleId matching should be enough, as words/letters define the puzzle.
      if (saved.puzzleId !== puzzleId) {
          console.warn(`Loaded Letter Logic state for puzzle ${saved.puzzleId} but expected ${puzzleId}. Discarding.`);
          await AsyncStorage.removeItem(`${LETTER_LOGIC_SAVE_KEY_PREFIX}${puzzleId}`);
          return null;
      }

      // console.log(`Loaded Letter Logic state for puzzle: ${puzzleId}`);
      // Reconstruct the full state.
      const rehydratedState: LetterLogicState = {
        puzzle: currentPuzzleData, // Use the fresh puzzle data definition
        foundWords: saved.foundWords || [],
        currentInput: saved.currentInput || '',
        score: saved.score || 0,
        lastScoreChange: 0, // This is transient, not saved
      };
      // Ensure all words are still valid for the current puzzle (e.g. if puzzle definition changed)
      rehydratedState.foundWords = rehydratedState.foundWords.filter(word => currentPuzzleData.validWords.includes(word));

      return rehydratedState;
    }
  } catch (e) {
    console.error('Failed to load Letter Logic state.', e);
  }
  return null; // No saved state or error
};
