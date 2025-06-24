export type LetterFeedback = 'correct' | 'present' | 'absent' | 'pending';

export interface Guess {
  word: string;
  feedback: LetterFeedback[];
}

export interface WordWiseState {
  targetWord: string;
  guesses: Guess[];
  currentGuess: string;
  maxGuesses: number;
  wordLength: number;
  isGameOver: boolean;
  didWin: boolean;
  score: number;
  lastScoreChange: number; // For displaying "+X" briefly
  // For keyboard coloring
  letterStatuses: { [letter: string]: LetterFeedback };

  // Versus AI Mode specific state
  gameMode: 'classic' | 'versusAI';
  currentTurn?: 'user' | 'ai'; // Who is currently guessing
  aiBotId?: string; // ID of the AI bot opponent
  aiGuesses?: Guess[]; // AI's guesses and feedback
  aiWon?: boolean; // Did the AI win? (User loses in this case)
}

// Re-exporting AITriggerType and AIResponse if they are defined here
// For now, assuming they are globally accessible or imported where needed.
// If not, they should be imported from '../../ai/types' or similar.
// For this file, we only need what's directly part of WordWiseState.

// We might also need to re-export GameKey if it's used by AISimulator context within WordWise logic
// For now, assuming GameKey is imported where AISimulator is used.
