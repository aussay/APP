export interface PuzzleGridCell {
  x: number;
  y: number;
  isBlack: boolean;
  letter?: string; // The letter currently in the cell
  correctLetter?: string; // The correct letter for this cell (if not black)
  number?: number; // Number for clue referencing
}

export interface PuzzleGridWord {
  id: string;
  clue: string;
  answer: string;
  direction: 'across' | 'down';
  startCell: { x: number; y: number };
  length: number;
}

export interface PuzzleGridData {
  id: string;
  title: string;
  gridSize: { rows: number; cols: number };
  cells: PuzzleGridCell[][]; // 2D array representing the grid
  words: PuzzleGridWord[];
}

export interface PuzzleGridState {
  gridData: PuzzleGridData;
  currentFocus?: { wordId: string; cellIndex: number }; // Currently selected word and cell within it
  userLetters: { [key: string]: string }; // { 'x,y': 'A' }
  isComplete: boolean;
  score: number;
  lastScoreChange: number; // For displaying "+10" briefly
}
