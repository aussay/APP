import { LetterFeedback, Guess } from './types';
import { wordWiseArchive2024 } from './archive/2024'; // Adjust the import based on your project structure

// A simplified list of valid 5-letter words for bots to choose from.
// In a real app, this would be much larger and aligned with the main game's dictionary.
const BOT_WORD_LIST = [
  ...wordWiseArchive2024 // Use the full production word list for bot guesses
];

export interface WordWiseAIBot {
  id: string;
  name: string;
  difficulty?: 'easy' | 'medium' | 'hard'; // Optional for future use
  generateGuess: (
    targetWordLength: number,
    previousGuesses: Guess[], // Bot's own previous guesses and their feedback
    // wordList: string[] // Full dictionary for more advanced bots
  ) => string; // Returns the bot's next guess
  getFeedbackLine: (guessContext: 'making_guess' | 'guess_correct' | 'guess_incorrect' | 'win' | 'lose') => string;
}

// --- Bot Definitions ---

export const RockBot: WordWiseAIBot = {
  id: 'rock_bot',
  name: 'Rock',
  difficulty: 'easy',
  generateGuess: (targetWordLength, previousGuesses) => {
    const simpleWords = ["ROCKS", "STONE", "EARTH", "TREES", "WATER"]; // Very limited pool
    let guess = simpleWords[previousGuesses.length % simpleWords.length] || "DEBUG"; // Cycle through
    if (guess.length !== targetWordLength) { // Fallback if length mismatch
        const fittingFallback = BOT_WORD_LIST.find(w => w.length === targetWordLength) || "VALID"; // Ensure valid length
        return fittingFallback.substring(0, targetWordLength);
    }
    return guess;
  },
  getFeedbackLine: (context) => {
    switch (context) {
      case 'making_guess': return "Rock thinking...";
      case 'guess_correct': return "Rock correct."; // Not used if bot wins on its guess
      case 'guess_incorrect': return "Rock wrong."; // Not used if bot makes a guess that isn't the word
      case 'win': return "Rock win.";
      case 'lose': return "Rock lose.";
      default: return "Rock.";
    }
  }
};

export const LexiBot: WordWiseAIBot = {
  id: 'lexi_bot',
  name: 'Lexi',
  difficulty: 'medium',
  generateGuess: (targetWordLength, previousGuesses) => {
    // Slightly more strategic: Tries to use common letters, avoids re-using 'absent' letters.
    // This is a simplified simulation of strategy.
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
    const knownAbsent = new Set<string>();
    const knownPresent = new Set<string>(); // Letters known to be in the word
    const knownCorrectPositions: (string | null)[] = Array(targetWordLength).fill(null);

    previousGuesses.forEach(g => {
      g.word.split('').forEach((char, i) => {
        if (g.feedback[i] === 'absent') knownAbsent.add(char);
        if (g.feedback[i] === 'present') knownPresent.add(char);
        if (g.feedback[i] === 'correct') knownCorrectPositions[i] = char;
      });
    });

    // Try to build a word with correct letters and new letters
    let potentialGuess = "";
    // First fill known correct positions
    for(let i=0; i<targetWordLength; i++) {
        if(knownCorrectPositions[i]) {
            potentialGuess += knownCorrectPositions[i];
        } else {
            potentialGuess += "_"; // Placeholder for now
        }
    }

    // Try to find a word from BOT_WORD_LIST that matches constraints
    // Simple approach: filter BOT_WORD_LIST
    const validGuesses = BOT_WORD_LIST.filter(word => {
        if (word.length !== targetWordLength) return false;
        // Check against knownAbsent
        for (const char of word) {
            if (knownAbsent.has(char) && !knownPresent.has(char) && !knownCorrectPositions.includes(char)) return false;
        }
        // Check against knownCorrectPositions
        for(let i=0; i<targetWordLength; i++) {
            if(knownCorrectPositions[i] && word[i] !== knownCorrectPositions[i]) return false;
            // If a letter is known correct at a position, but current word has different one there.
            if(knownCorrectPositions[i] === null && knownCorrectPositions.includes(word[i])) return false; // Avoid using a correctly placed letter elsewhere
        }
        // Check if all 'present' letters are in the word
        for (const presentLetter of knownPresent) {
            if (!word.includes(presentLetter)) return false;
        }
        // Ensure not to repeat previous guesses
        if (previousGuesses.some(pg => pg.word === word)) return false;

        return true;
    });

    if (validGuesses.length > 0) {
        return validGuesses[Math.floor(Math.random() * validGuesses.length)];
    }

    // Fallback: pick a random word not yet guessed, trying to use present letters
    const availableWords = BOT_WORD_LIST.filter(w => w.length === targetWordLength && !previousGuesses.some(pg => pg.word === w));
    if (availableWords.length > 0) return availableWords[Math.floor(Math.random() * availableWords.length)];
    return "DEBUG"; // Absolute fallback
  },
  getFeedbackLine: (context) => {
    switch (context) {
      case 'making_guess': return "Lexi calculating optimal guess...";
      case 'win': return "Logical deduction leads to victory. As expected.";
      case 'lose': return "Opponent's strategy was... unexpectedly effective.";
      default: return "Lexi processes.";
    }
  }
};

export const RandyBot: WordWiseAIBot = {
  id: 'randy_bot',
  name: 'Random Randy',
  difficulty: 'medium', // Can be easy or hard depending on luck!
  generateGuess: (targetWordLength, previousGuesses) => {
    const availableWords = BOT_WORD_LIST.filter(w => w.length === targetWordLength && !previousGuesses.some(pg => pg.word === w));
    if (availableWords.length > 0) {
      return availableWords[Math.floor(Math.random() * availableWords.length)];
    }
    return "RANDM"; // Fallback
  },
  getFeedbackLine: (context) => {
    const randomLines = [
        "Here goes nothing!", "Feeling this one!", "Is it... this?!",
        "My circuits picked this!", "Let's see if this sticks!"
    ];
    switch (context) {
      case 'making_guess': return randomLines[Math.floor(Math.random() * randomLines.length)];
      case 'win': return "Wooah! I actually got it! Totally random, totally awesome!";
      case 'lose': return "Aww, my randomizer failed me! You're too good!";
      default: return "Randy's rolling the dice...";
    }
  }
};

export const AIBotPersonalities: WordWiseAIBot[] = [RockBot, LexiBot, RandyBot];

export const getBotById = (id: string): WordWiseAIBot | undefined => {
    return AIBotPersonalities.find(bot => bot.id === id);
};
