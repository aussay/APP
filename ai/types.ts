// Defines the structure for an AI personality
export interface AIPersonality {
  id: string;
  name: string;
  // More specific voice/tone descriptors could be added later
}

// Defines a potential trigger for an AI response
export enum AITriggerType {
  GAME_START = 'GAME_START',
  GAME_WIN = 'GAME_WIN',
  GAME_LOSE = 'GAME_LOSE',
  CORRECT_ACTION = 'CORRECT_ACTION', // e.g., correct word in Word Wise, correct group in LinkUp
  INCORRECT_ACTION = 'INCORRECT_ACTION',
  MILESTONE_REACHED = 'MILESTONE_REACHED', // e.g., 50% complete in Puzzle Grid
  HINT_REQUESTED = 'HINT_REQUESTED',
  IDLE_PROMPT = 'IDLE_PROMPT', // If user is inactive
  CROSS_GAME_SUGGESTION = 'CROSS_GAME_SUGGESTION', // After finishing a game
  LOW_TIME_WARNING = 'LOW_TIME_WARNING', // If time-based challenges are added
  STREAK_CONTINUED = 'STREAK_CONTINUED',
  STREAK_BROKEN = 'STREAK_BROKEN',
  PANGRAM_FOUND = 'PANGRAM_FOUND', // Specific to Letter Logic
  // Add more specific triggers as needed per game
}

// Contextual information passed to the AI to help decide on a response
export interface AIResponseContext {
  gameId: string; // e.g., 'puzzle_grid', 'word_wise'
  triggerType: AITriggerType;
  currentScore?: number;
  mistakesMade?: number;
  progressPercentage?: number; // e.g., 0-100
  lastWordFound?: string;
  timeRemaining?: number;
  streakLength?: number;
  // Any other game-specific data that might influence AI response
  [key: string]: any;
}

// The actual response from the AI
export interface AIResponse {
  text: string;
  // Optional: suggestions for next actions, e.g., try another game
  suggestions?: { text: string; action: () => void }[];
  // Optional: mood or emotion conveyed by the AI (for UI flair)
  emotion?: 'happy' | 'neutral' | 'encouraging' | 'smug' | 'taunting';
}

// Defines the structure for how an AI personality responds to specific triggers
export type AIBehaviorRule = (context: AIResponseContext) => AIResponse | null;

export interface AIPersonalityBehavior {
  personalityId: string;
  gameSpecificRules: {
    [gameId: string]: { // e.g., 'puzzle_grid', 'word_wise'
      [triggerType in AITriggerType]?: AIBehaviorRule[];
    };
  };
  generalRules?: { // Fallback rules not specific to any game
    [triggerType in AITriggerType]?: AIBehaviorRule[];
  };
}

// Represents the overall state or configuration for the AI simulation system
export interface AISimulatorConfig {
  personalities: AIPersonality[];
  behaviors: AIPersonalityBehavior[];
  defaultPersonalityId?: string;
}
