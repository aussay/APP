// 365 daily Insight puzzles for 2025, one per day. Replace with real puzzles as needed.
import { InsightPuzzle } from '../types';

const basePuzzle: InsightPuzzle = {
  id: 'simpleLogic1',
  title: 'Simple Deductions',
  description: 'Figure out who owns which pet and likes which color.',
  categories: [
    { id: 'names', name: 'Names', items: ['Alice', 'Bob', 'Charlie'] },
    { id: 'pets', name: 'Pets', items: ['Dog', 'Cat', 'Bird'] },
    { id: 'colors', name: 'Favorite Colors', items: ['Red', 'Blue', 'Green'] },
  ],
  primaryCategoryItems: ['Person 1', 'Person 2', 'Person 3'],
  clues: [
    { id: 'c1', text: 'Alice owns a Dog.' },
    { id: 'c2', text: 'The person who likes Blue owns a Bird.' },
    { id: 'c3', text: 'Bob does not like Green.' },
    { id: 'c4', text: 'Charlie is Person 3.'},
    { id: 'c5', text: 'Person 1 likes Red.'}
  ],
  solution: {
    'Person 1': { names: 'Alice', pets: 'Dog', colors: 'Red' },
    'Person 2': { names: 'Bob', pets: 'Cat', colors: 'Blue' },
    'Person 3': { names: 'Charlie', pets: 'Bird', colors: 'Green' },
  },
};

export const insightArchive2025: InsightPuzzle[] = Array.from({ length: 365 }, (_, i) => ({
  ...basePuzzle,
  id: `insight_${2025}${(i+1).toString().padStart(3, '0')}`,
}));
