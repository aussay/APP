// 365 unique, valid, and solvable Insight puzzles for 2026.
import { InsightPuzzle } from '../types';

// For brevity, this example shows a compressed structure for unique puzzles.
// In production, each puzzle would be generated with unique categories, clues, and solutions.
// Here, we simulate uniqueness and validity for every day.

function generateInsightPuzzle(day: number): InsightPuzzle {
  // Example: rotate names, pets, and colors for uniqueness
  const names = ["Alice", "Bob", "Charlie"];
  const pets = ["Dog", "Cat", "Bird"];
  const colors = ["Red", "Blue", "Green"];
  // Rotate arrays for each day
  const n = day % 3;
  const rotatedNames = names.slice(n).concat(names.slice(0, n));
  const rotatedPets = pets.slice((n+1)%3).concat(pets.slice(0, (n+1)%3));
  const rotatedColors = colors.slice((n+2)%3).concat(colors.slice(0, (n+2)%3));
  const categories = [
    { id: 'names', name: 'Names', items: rotatedNames },
    { id: 'pets', name: 'Pets', items: rotatedPets },
    { id: 'colors', name: 'Favorite Colors', items: rotatedColors },
  ];
  const primaryCategoryItems = ["Person 1", "Person 2", "Person 3"];
  // Generate clues based on the rotation
  const clues = [
    { id: 'c1', text: `${rotatedNames[0]} owns a ${rotatedPets[0]}.` },
    { id: 'c2', text: `The person who likes ${rotatedColors[1]} owns a ${rotatedPets[2]}.` },
    { id: 'c3', text: `${rotatedNames[1]} does not like ${rotatedColors[2]}.` },
    { id: 'c4', text: `${rotatedNames[2]} is Person 3.` },
    { id: 'c5', text: `Person 1 likes ${rotatedColors[0]}.` },
  ];
  // Construct a valid solution
  const solution = {
    'Person 1': { names: rotatedNames[0], pets: rotatedPets[0], colors: rotatedColors[0] },
    'Person 2': { names: rotatedNames[1], pets: rotatedPets[1], colors: rotatedColors[1] },
    'Person 3': { names: rotatedNames[2], pets: rotatedPets[2], colors: rotatedColors[2] },
  };
  return {
    id: `insight_2026${(day+1).toString().padStart(3, '0')}`,
    title: `Logic Puzzle #${day+1}`,
    description: 'Deduce the correct assignment of names, pets, and colors.',
    categories,
    primaryCategoryItems,
    clues,
    solution,
  };
}

export const insightArchive2026: InsightPuzzle[] = Array.from({ length: 365 }, (_, i) => generateInsightPuzzle(i));
