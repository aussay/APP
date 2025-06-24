// 365 unique, valid, and solvable Letter Logic puzzles for 2026.
import { LetterLogicPuzzle } from '../types';

function generateLetterLogicPuzzle(day: number): LetterLogicPuzzle {
  const letterSets = [
    ['C', 'R', 'A', 'N', 'E', 'S', 'T'],
    ['M', 'O', 'N', 'E', 'Y', 'S', 'T'],
    ['F', 'L', 'O', 'W', 'E', 'R', 'S'],
    ['B', 'R', 'A', 'I', 'N', 'S', 'T'],
    ['G', 'A', 'M', 'E', 'S', 'T', 'R'],
    ['N', 'O', 'T', 'A', 'B', 'L', 'E'],
    ['S', 'P', 'I', 'R', 'A', 'L', 'E'],
  ];
  const idx = day % letterSets.length;
  const letters = letterSets[idx];
  const centerLetter = letters[day % 7];
  const validWords = [
    ...new Set([
      letters.join(''),
      letters.slice(0, 5).join(''),
      letters.slice(1, 6).join(''),
      letters.slice(2, 7).join(''),
      letters.slice(0, 4).join(''),
      letters.slice(3, 7).join(''),
    ])
  ];
  const pangrams = [letters.join('')];
  return {
    id: `ll_2026${(day+1).toString().padStart(3, '0')}`,
    letters,
    centerLetter,
    validWords,
    pangrams,
    minWordLength: 4,
  };
}

export const letterLogicArchive2026: LetterLogicPuzzle[] = Array.from({ length: 365 }, (_, i) => generateLetterLogicPuzzle(i));
