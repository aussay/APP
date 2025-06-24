export interface LinkUpItem {
  id: string;
  text: string; // The word or phrase displayed
  categoryId: string;
}

export interface LinkUpCategory {
  id: string;
  name: string; // e.g., "Fish" or "Things that are Cold"
  level?: number; // Optional difficulty/order indicator
}

export interface LinkUpPuzzle {
  id: string;
  items: LinkUpItem[];
  categories: LinkUpCategory[]; // Contains the definitions of the correct groupings
  itemsPerGroup: number; // Usually 4
}

export interface LinkUpState {
  puzzle: LinkUpPuzzle;
  selectedItems: LinkUpItem[];
  foundCategories: { categoryId: string; items: LinkUpItem[] }[];
  mistakesMade: number;
  maxMistakes: number;
  isGameOver: boolean;
  didWin: boolean;
  remainingItems: LinkUpItem[]; // Items not yet grouped
}
