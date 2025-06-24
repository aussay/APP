import { WordWiseState, Guess, LetterFeedback } from './types';

const DEFAULT_WORD_LENGTH = 5;
const DEFAULT_MAX_GUESSES = 6;

// In a real app, word list would be more extensive and loaded from assets
import { wordWiseArchive2024 } from './archive/2024';
const sampleWordList = wordWiseArchive2024;

function getRandomWord(length: number): string {
  const filteredList = sampleWordList.filter(word => word.length === length);
  return filteredList[Math.floor(Math.random() * filteredList.length)] || 'DEBUG'; // Fallback for safety
}

import { WordWiseAIBot, getBotById } from './aiBots'; // Import AI Bot logic
import { wordWiseArchive2025 } from './archive/2025';

export function initializeWordWiseState(
  wordLength: number = DEFAULT_WORD_LENGTH,
  maxGuesses: number = DEFAULT_MAX_GUESSES,
  targetWord?: string,
  gameMode: 'classic' | 'versusAI' = 'classic',
  aiBotId?: string
): WordWiseState {
  const actualTargetWord = targetWord || getRandomWord(wordLength);
  console.log(`Initializing WordWise. Mode: ${gameMode}, Target: ${actualTargetWord}`);
  return {
    targetWord: actualTargetWord,
    guesses: [], // User's guesses
    currentGuess: '',
    maxGuesses, // Max guesses per player in versus mode, or total in classic
    wordLength,
    gameMode,
    currentTurn: gameMode === 'versusAI' ? 'user' : undefined, // User starts in Versus AI
    aiBotId: gameMode === 'versusAI' ? aiBotId : undefined,
    aiGuesses: gameMode === 'versusAI' ? [] : undefined,
    aiWon: gameMode === 'versusAI' ? false : undefined,
    isGameOver: false,
    didWin: false,
    letterStatuses: {},
    score: 0,
    lastScoreChange: 0,
  };
}

export function processGuess(currentState: WordWiseState, guessedWord: string): WordWiseState {
  if (guessedWord.length !== currentState.wordLength || currentState.isGameOver) {
    return currentState; // Invalid guess or game already over
  }

  const target = currentState.targetWord.toUpperCase();
  const guess = guessedWord.toUpperCase();
  const feedback: LetterFeedback[] = Array(currentState.wordLength).fill('absent');
  const newLetterStatuses = { ...currentState.letterStatuses };

  const targetLetterCounts: { [key: string]: number } = {};
  for (const letter of target) {
    targetLetterCounts[letter] = (targetLetterCounts[letter] || 0) + 1;
  }

  // First pass: check for correct letters in correct positions
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === target[i]) {
      feedback[i] = 'correct';
      targetLetterCounts[guess[i]]--;
      newLetterStatuses[guess[i]] = 'correct';
    }
  }

  // Second pass: check for correct letters in wrong positions
  for (let i = 0; i < guess.length; i++) {
    if (feedback[i] !== 'correct') { // Only consider letters not already marked 'correct'
      if (target.includes(guess[i]) && targetLetterCounts[guess[i]] > 0) {
        feedback[i] = 'present';
        targetLetterCounts[guess[i]]--;
        if (newLetterStatuses[guess[i]] !== 'correct') { // Don't downgrade 'correct' status
            newLetterStatuses[guess[i]] = 'present';
        }
      } else {
        // If letter not 'correct' or 'present', it's 'absent'
        if (!newLetterStatuses[guess[i]] || newLetterStatuses[guess[i]] === 'absent') {
             newLetterStatuses[guess[i]] = 'absent';
        }
      }
    }
  }

  // Update status for letters not in the guess but previously marked, ensure they are not 'pending'
  Object.keys(newLetterStatuses).forEach(letter => {
    if (newLetterStatuses[letter] === 'pending') { // Should not happen with this logic but as a safeguard
        if (!target.includes(letter)) newLetterStatuses[letter] = 'absent';
    }
  });


  const newGuesses = [...currentState.guesses, { word: guess, feedback }];
  const didWin = guess === target;
  const isGameOver = didWin || newGuesses.length >= currentState.maxGuesses;

  return {
    ...currentState,
    guesses: newGuesses,
    currentGuess: '', // Reset for next guess
    isGameOver,
    didWin,
    letterStatuses: newLetterStatuses,
  };
}

// Helper to add letter to current guess
export function addLetterToGuess(currentState: WordWiseState, letter: string): WordWiseState {
    if (currentState.currentGuess.length < currentState.wordLength && !currentState.isGameOver) {
        return {
            ...currentState,
            currentGuess: currentState.currentGuess + letter.toUpperCase(),
        };
    }
    return currentState;
}

// Helper to remove letter from current guess
export function removeLetterFromGuess(currentState: WordWiseState): WordWiseState {
    if (currentState.currentGuess.length > 0 && !currentState.isGameOver) {
        return {
            ...currentState,
            currentGuess: currentState.currentGuess.slice(0, -1),
        };
    }
    return currentState;
}

export function getWordWiseForDate(date: Date): string | null {
  const start = new Date(2025, 0, 1);
  const end = new Date(2025, 11, 31);
  if (date < start || date > end) return null;
  const index = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return wordWiseArchive2025[index] || null;
}

export function getWordWiseArchiveUpToDate(date: Date): string[] {
  const start = new Date(2025, 0, 1);
  if (date < start) return [];
  const index = Math.min(Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)), 364);
  return wordWiseArchive2025.slice(0, index + 1);
}
