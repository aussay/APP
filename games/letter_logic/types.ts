export interface LetterLogicPuzzle {
  id: string;
  letters: string[]; // e.g., ['A', 'B', 'C', 'D', 'E', 'F', 'G']
  centerLetter: string; // e.g., 'A'
  validWords: string[]; // List of all possible words
  pangrams: string[]; // Words that use all unique letters
  minWordLength: number;
}

export interface LetterLogicState {
  puzzle: LetterLogicPuzzle;
  foundWords: string[];
  currentInput: string;
  score: number;
  lastScoreChange: number; // For displaying "+X" briefly
  // For Phase 4 (reimagined structure), more state might be needed
}
