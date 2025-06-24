import { PuzzleGridData, PuzzleGridState, PuzzleGridCell, PuzzleGridWord } from './types';
import { puzzleGridArchive2025 } from './archive/2025';

// Remove samplePuzzle and use a real puzzle from the archive
export function getTodayPuzzleGrid(): PuzzleGridData {
  // For demo, use the first puzzle; in production, select by date
  return puzzleGridArchive2025[0];
}

function generateGridCells(puzzleData: PuzzleGridData): PuzzleGridCell[][] {
  const cells: PuzzleGridCell[][] = Array(puzzleData.gridSize.rows)
    .fill(null)
    .map((_, r) =>
      Array(puzzleData.gridSize.cols)
        .fill(null)
        .map((__, c) => ({
          x: c,
          y: r,
          isBlack: true, // Default to black, will be overridden by words
        }))
    );

  let cellNumber = 1;
  const numberedCells = new Set<string>();

  puzzleData.words.forEach(word => {
    let { x, y } = word.startCell;
    // Assign number to the start cell if it hasn't been numbered for another word starting there
    const startCellKey = `${x},${y}`;
    if (!numberedCells.has(startCellKey)) {
        cells[y][x].number = cellNumber++;
        numberedCells.add(startCellKey);
    } else {
        // Find existing number if another word starts at the same cell
        for (const w of puzzleData.words) {
            if (w.startCell.x === x && w.startCell.y === y && cells[y][x].number) {
                // cells[y][x].number is already set
                break;
            }
        }
    }


    for (let i = 0; i < word.answer.length; i++) {
      cells[y][x].isBlack = false;
      cells[y][x].correctLetter = word.answer[i];
      if (word.direction === 'across') {
        x++;
      } else {
        y++;
      }
    }
  });
  return cells;
}

const todayPuzzle = getTodayPuzzleGrid();
todayPuzzle.cells = generateGridCells(todayPuzzle);


export function initializePuzzleGridState(puzzleData: PuzzleGridData = todayPuzzle): PuzzleGridState {
  // In a real scenario, puzzleData would be loaded dynamically
  const gridWithCorrectLetters = {
      ...puzzleData,
      cells: generateGridCells(puzzleData),
  };

  return {
    gridData: gridWithCorrectLetters,
    userLetters: {},
    isComplete: false,
    currentFocus: undefined, // Or set to the first word
    score: 0,
    lastScoreChange: 0,
  };
}

export function handleLetterInput(
  currentState: PuzzleGridState,
  cell: { x: number; y: number },
  letter: string | null // null to clear
): PuzzleGridState {
  const userLetters = { ...currentState.userLetters };
  const key = `${cell.x},${cell.y}`;
  let newScore = currentState.score;
  let scoreChange = 0;

  const targetCell = currentState.gridData.cells[cell.y][cell.x];

  if (letter) {
    const previousLetter = userLetters[key];
    userLetters[key] = letter.toUpperCase();
    // Award points only if the letter is correct and wasn't correct before, or changing to correct
    if (userLetters[key] === targetCell.correctLetter && previousLetter !== targetCell.correctLetter) {
      scoreChange = 10;
      newScore += scoreChange;
    } else if (previousLetter === targetCell.correctLetter && userLetters[key] !== targetCell.correctLetter) {
      // Optional: Penalize for changing a correct letter to incorrect, or just remove points
      // For now, no penalty, but points for this cell are effectively lost until corrected.
      // If we had per-cell point tracking, we'd subtract here.
    }
  } else {
    // If clearing a correct letter, optionally remove points. For now, no change.
    delete userLetters[key];
  }

  // Check for completion
  const isNowComplete = checkCompletion(currentState.gridData, userLetters);
  if (isNowComplete && !currentState.isComplete) { // Puzzle just got completed
    scoreChange += 200; // Bonus for completing the puzzle
    newScore += 200;
  }

  return {
    ...currentState,
    userLetters,
    isComplete: isNowComplete,
    score: newScore,
    lastScoreChange: scoreChange,
  };
}

export function checkCompletion(gridData: PuzzleGridData, userLetters: { [key: string]: string }): boolean {
  for (const row of gridData.cells) {
    for (const cell of row) {
      if (!cell.isBlack) {
        const key = `${cell.x},${cell.y}`;
        if (userLetters[key] !== cell.correctLetter) {
          return false;
        }
      }
    }
  }
  return true;
}

// Helper function to get word cells (useful for UI)
export function getWordCells(word: PuzzleGridWord, gridData: PuzzleGridData): PuzzleGridCell[] {
    const resultCells: PuzzleGridCell[] = [];
    let {x, y} = word.startCell;
    for(let i=0; i < word.length; i++) {
        if(y < gridData.gridSize.rows && x < gridData.gridSize.cols) {
            resultCells.push(gridData.cells[y][x]);
        }
        if (word.direction === 'across') {
            x++;
        } else {
            y++;
        }
    }
    return resultCells;
}

// --- Game State Persistence ---
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUZZLE_GRID_SAVE_KEY_PREFIX = 'PuzzleGrid_SavedState_';

interface PuzzleGridSavedState {
  userLetters: { [key: string]: string };
  score: number;
  // puzzleId: string; // To identify which puzzle this state belongs to
}

export const savePuzzleGridState = async (puzzleId: string, state: PuzzleGridState): Promise<void> => {
  if (state.isComplete) { // Don't save completed puzzles
    await AsyncStorage.removeItem(`${PUZZLE_GRID_SAVE_KEY_PREFIX}${puzzleId}`);
    console.log(`Cleared saved state for completed Puzzle Grid: ${puzzleId}`);
    return;
  }
  try {
    const stateToSave: PuzzleGridSavedState = {
      userLetters: state.userLetters,
      score: state.score,
      // puzzleId: puzzleId, // Or state.gridData.id
    };
    const jsonValue = JSON.stringify(stateToSave);
    await AsyncStorage.setItem(`${PUZZLE_GRID_SAVE_KEY_PREFIX}${puzzleId}`, jsonValue);
    console.log(`Puzzle Grid state saved for puzzle: ${puzzleId}`);
  } catch (e) {
    console.error('Failed to save Puzzle Grid state.', e);
  }
};

export const loadPuzzleGridState = async (puzzleId: string, currentPuzzleData: PuzzleGridData): Promise<PuzzleGridState | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(`${PUZZLE_GRID_SAVE_KEY_PREFIX}${puzzleId}`);
    if (jsonValue != null) {
      const saved: PuzzleGridSavedState = JSON.parse(jsonValue);
      console.log(`Loaded Puzzle Grid state for puzzle: ${puzzleId}`);
      // Reconstruct the full state. isComplete will be re-evaluated.
      const rehydratedState: PuzzleGridState = {
        gridData: currentPuzzleData, // Use the fresh puzzle data definition
        userLetters: saved.userLetters,
        score: saved.score,
        isComplete: checkCompletion(currentPuzzleData, saved.userLetters), // Re-check completion
        lastScoreChange: 0, // This is transient, not saved
        currentFocus: undefined, // Focus is not saved
      };
      return rehydratedState;
    }
  } catch (e) {
    console.error('Failed to load Puzzle Grid state.', e);
  }
  return null; // No saved state or error
};

export function getPuzzleGridForDate(date: Date) {
  const start = new Date(2025, 0, 1);
  const end = new Date(2025, 11, 31);
  if (date < start || date > end) return null;
  const index = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return puzzleGridArchive2025[index] || null;
}

export function getPuzzleGridArchiveUpToDate(date: Date) {
  const start = new Date(2025, 0, 1);
  const end = new Date(2025, 11, 31);
  if (date < start) return [];
  const index = Math.min(Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)), 364);
  return puzzleGridArchive2025.slice(0, index + 1);
}
