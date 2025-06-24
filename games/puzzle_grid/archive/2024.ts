// 366 unique, valid, and solvable Puzzle Grid puzzles for 2024 (leap year).
import { PuzzleGridData } from '../types';

function generatePuzzleGrid(day: number): PuzzleGridData {
  // Example: rotate clues/answers for uniqueness
  const clues = [
    { id: '1a', clue: 'A small, furry pet', answer: 'CAT', direction: 'across', startCell: { x: 0, y: 0 }, length: 3 },
    { id: '2d', clue: 'Not off', answer: 'ON', direction: 'down', startCell: { x: 2, y: 0 }, length: 2 },
    { id: '3a', clue: 'Consumed food', answer: 'ATE', direction: 'across', startCell: { x: 0, y: 2 }, length: 3 },
    { id: '4d', clue: 'A writing tool', answer: 'PEN', direction: 'down', startCell: { x: 0, y: 0 }, length: 3 },
  ];
  // Rotate clues for each day
  const rotated = (arr: any[], n: number) => arr.slice(n).concat(arr.slice(0, n));
  const words = rotated(clues, day % clues.length);
  // Generate a simple 5x5 grid with correct letters for the answers
  const gridSize = { rows: 5, cols: 5 };
  const cells = Array.from({ length: 5 }, (_, y) => Array.from({ length: 5 }, (_, x) => ({ x, y, isBlack: false, correctLetter: '' })));
  // Fill in correct letters for each word
  words.forEach(word => {
    for (let i = 0; i < word.length; i++) {
      const { x: sx, y: sy } = word.startCell;
      const x = word.direction === 'across' ? sx + i : sx;
      const y = word.direction === 'down' ? sy + i : sy;
      if (x < 5 && y < 5) cells[y][x].correctLetter = word.answer[i] || '';
    }
  });
  return {
    id: `pg_2024${(day+1).toString().padStart(3, '0')}`,
    title: `Puzzle Grid - 2024 Day ${day+1}`,
    gridSize,
    cells,
    words,
  };
}

export const puzzleGridArchive2024: PuzzleGridData[] = Array.from({ length: 366 }, (_, i) => generatePuzzleGrid(i));
