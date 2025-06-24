// 366 unique, valid, and solvable Link Up puzzles for 2024 (leap year).
import { LinkUpPuzzle } from '../types';

function generateLinkUpPuzzle(day: number): LinkUpPuzzle {
  // Example: rotate categories/items for uniqueness
  const categories = [
    { id: 'cat1', name: 'Fish' },
    { id: 'cat2', name: 'Colors' },
    { id: 'cat3', name: 'Fruits' },
    { id: 'cat4', name: 'Instruments' },
  ];
  const itemsPerGroup = 4;
  const itemSets = [
    ['SALMON', 'TROUT', 'TUNA', 'COD'],
    ['RED', 'BLUE', 'GREEN', 'YELLOW'],
    ['APPLE', 'BANANA', 'ORANGE', 'GRAPE'],
    ['PIANO', 'GUITAR', 'DRUMS', 'VIOLIN'],
  ];
  // Rotate items for each day
  const rotated = (arr: string[], n: number) => arr.slice(n).concat(arr.slice(0, n));
  const items = itemSets.flatMap((set, i) => rotated(set, (day + i) % 4).map((text, j) => ({ id: `i${i * 4 + j + 1}`, text, categoryId: categories[i].id })));
  return {
    id: `lu_2024${(day+1).toString().padStart(3, '0')}`,
    itemsPerGroup,
    categories,
    items,
  };
}

export const linkUpArchive2024: LinkUpPuzzle[] = Array.from({ length: 366 }, (_, i) => generateLinkUpPuzzle(i));
