// Generic types for a grid-based logic puzzle.
// This will likely need significant expansion for specific puzzle types.

export interface LogicPuzzleCategory {
  id: string;
  name: string; // e.g., "Names", "Pets", "Colors"
  items: string[]; // e.g., ["Alice", "Bob"], ["Dog", "Cat"], ["Red", "Blue"]
}

// Represents a single clue
export interface LogicPuzzleClue {
  id: string;
  text: string;
  // How the clue translates to rules/constraints would be complex
  // and specific to the puzzle's rule engine.
  // For now, it's just text.
}

// Defines the structure of the solution grid.
// For example, if you have 3 categories with 3 items each,
// the grid might map items from Category 1 to Category 2, Category 1 to Category 3, etc.
// Or it could be a main entity (e.g. Person) linked to attributes (Pet, Color).
// This is highly dependent on the specific logic puzzle type.

// Let's assume a primary category (e.g., "Position 1", "Position 2")
// and other categories are attributes of these positions.
export interface LogicPuzzleGridSolution {
  // Example: solution[positionItem][categoryID] = attributeItem
  // e.g. solution["Person1"]["Pet"] = "Dog"
  [primaryItem: string]: {
    [categoryId: string]: string;
  };
}

export interface InsightPuzzle {
  id: string;
  title: string;
  description: string;
  categories: LogicPuzzleCategory[];
  // The primary category items that form one axis of the main grid (e.g., 5 houses, 5 people)
  primaryCategoryItems: string[];
  clues: LogicPuzzleClue[];
  solution: LogicPuzzleGridSolution; // The correct, complete solution
}

// Represents the player's current state of the grid
// This structure needs to allow for uncertainty initially (e.g. using null or sets of possibilities)
// For a simple prototype, we can assume direct placement.
export type UserGridState = {
  [primaryItem: string]: {
    [categoryId: string]: string | null; // string is the selected item from that category, null if not set
  };
};

export interface InsightGameState {
  puzzle: InsightPuzzle;
  userGrid: UserGridState;
  isComplete: boolean;
  score: number;
  lastScoreChange: number;
  // Clue satisfaction status could be tracked here
  // errors: string[]; // To list contradictions or mistakes
}
