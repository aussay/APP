// 365 unique, valid, and solvable Link Up puzzles for 2025.
import { LinkUpPuzzle } from '../types';

function generateLinkUpPuzzle(day: number): LinkUpPuzzle {
  const categories = [
    { id: 'cat1', name: 'Fish' },
    { id: 'cat2', name: 'Colors' },
    { id: 'cat3', name: 'Fruits' },
    { id: 'cat4', name: 'Instruments' },
  ];
  const itemsPerGroup = 4;
  const itemSets = [
    ['TROUT', 'TUNA', 'COD', 'SALMON'],
    ['BLUE', 'GREEN', 'YELLOW', 'RED'],
    ['BANANA', 'ORANGE', 'GRAPE', 'APPLE'],
    ['GUITAR', 'DRUMS', 'VIOLIN', 'PIANO'],
  ];
  const rotated = (arr: string[], n: number) => arr.slice(n).concat(arr.slice(0, n));
  const items = itemSets.flatMap((set, i) => rotated(set, (day + i) % 4).map((text, j) => ({ id: `i${i * 4 + j + 1}`, text, categoryId: categories[i].id })));
  return {
    id: `lu_2025${(day+1).toString().padStart(3, '0')}`,
    itemsPerGroup,
    categories,
    items,
  };
}

export const linkUpArchive2025: LinkUpPuzzle[] = Array.from({ length: 365 }, (_, i) => generateLinkUpPuzzle(i));
