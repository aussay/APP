import {
  initializeWordWiseState,
  processGuess,
  addLetterToGuess,
  removeLetterFromGuess,
  getWordWiseForDate,
} from '../../../games/word_wise/logic'; // Adjust path if necessary
import { WordWiseState, LetterFeedback } from '../../../games/word_wise/types';
import { wordWiseArchive2025 } from '../../../games/word_wise/archive/2025';


// Mock aiBots to prevent issues with imports if not testing AI functionality directly
jest.mock('../../../games/word_wise/aiBots', () => ({
  getBotById: jest.fn(),
}));

describe('WordWise Logic', () => {
  describe('initializeWordWiseState', () => {
    it('should initialize with default values', () => {
      const state = initializeWordWiseState();
      expect(state.wordLength).toBe(5);
      expect(state.maxGuesses).toBe(6);
      expect(state.targetWord).toHaveLength(5); // Relies on getRandomWord and sample list
      expect(state.guesses).toEqual([]);
      expect(state.isGameOver).toBe(false);
      expect(state.didWin).toBe(false);
    });

    it('should initialize with a specific target word', () => {
      const target = 'TESTS';
      const state = initializeWordWiseState(5, 6, target);
      expect(state.targetWord).toBe(target);
    });

    it('should initialize for versus AI mode', () => {
        const state = initializeWordWiseState(5, 6, 'BRAIN', 'versusAI', 'bot1');
        expect(state.gameMode).toBe('versusAI');
        expect(state.currentTurn).toBe('user');
        expect(state.aiBotId).toBe('bot1');
        expect(state.aiGuesses).toEqual([]);
        expect(state.aiWon).toBe(false);
    });
  });

  describe('processGuess', () => {
    let initialState: WordWiseState;
    const targetWord = 'APPLE';

    beforeEach(() => {
      initialState = initializeWordWiseState(targetWord.length, 6, targetWord);
    });

    it('should return current state if guess length is wrong', () => {
      const state = processGuess(initialState, 'APP');
      expect(state).toBe(initialState);
    });

    it('should return current state if game is over', () => {
      initialState.isGameOver = true;
      const state = processGuess(initialState, 'APPLY');
      expect(state).toBe(initialState);
    });

    it('should correctly process a guess with mixed feedback', () => {
      // Target: APPLE
      // Guess:  APPLY
      const { guesses, letterStatuses } = processGuess(initialState, 'APPLY');
      const expectedFeedback: LetterFeedback[] = ['correct', 'correct', 'absent', 'correct', 'absent'];
      expect(guesses[0].word).toBe('APPLY');
      expect(guesses[0].feedback).toEqual(expectedFeedback);
      expect(letterStatuses['A']).toBe('correct');
      expect(letterStatuses['P']).toBe('correct');
      expect(letterStatuses['L']).toBe('correct');
      expect(letterStatuses['Y']).toBe('absent');
    });

    it('should correctly process a guess with "present" feedback for duplicate letters', () => {
        // Target: APPLE (P appears twice)
        // Guess:  PAPER (P is correct once, present once)
        const state1 = processGuess(initialState, 'PAPER');
        // P (idx 1) is correct. P (idx 2) is present. A (idx 0) is correct. E,R are absent.
        // Expected: A: correct, P: correct, P: present, L: absent, E: absent
        // Actual guess: P A P E R
        // Feedback:     C P C A A (Corrected logic)
        // Target:       A P P L E
        // Guess:        P A P E R
        // Expected FB:  P(present) A(correct) P(correct) E(absent) R(absent)
        const expectedFeedback: LetterFeedback[] = ['present', 'correct', 'correct', 'absent', 'absent'];
        expect(state1.guesses[0].word).toBe('PAPER');
        expect(state1.guesses[0].feedback).toEqual(expectedFeedback);
        expect(state1.letterStatuses['P']).toBe('correct'); // P was correct at least once
        expect(state1.letterStatuses['A']).toBe('correct');
        expect(state1.letterStatuses['E']).toBe('absent');
        expect(state1.letterStatuses['R']).toBe('absent');
    });


    it('should mark game as won if guess is correct', () => {
      const state = processGuess(initialState, 'APPLE');
      expect(state.didWin).toBe(true);
      expect(state.isGameOver).toBe(true);
    });

    it('should mark game as over if max guesses reached', () => {
      let state = initialState;
      const guesses = ['WRONG', 'GUESS', 'AGAIN', 'ANDSO', 'FORTH', 'LAST1']; // 6 guesses
      for (const guess of guesses) {
        state = processGuess(state, guess);
      }
      expect(state.isGameOver).toBe(true);
      expect(state.didWin).toBe(false);
      expect(state.guesses).toHaveLength(6);
    });

    it('should handle target word with duplicate letters correctly', () => {
        // Target: SPOON
        // Guess:  BOOKS
        const stateSpoon = initializeWordWiseState(5, 6, 'SPOON');
        const result = processGuess(stateSpoon, 'BOOKS');
        // Expected: B(absent), O(present), O(correct), K(absent), S(present)
        const expectedFeedback: LetterFeedback[] = ['absent', 'present', 'correct', 'absent', 'present'];
        expect(result.guesses[0].feedback).toEqual(expectedFeedback);
        expect(result.letterStatuses['S']).toBe('present');
        expect(result.letterStatuses['P']).toBeUndefined(); // Not in guess
        expect(result.letterStatuses['O']).toBe('correct'); // One O is correct, one is present
        expect(result.letterStatuses['N']).toBeUndefined(); // Not in guess
        expect(result.letterStatuses['B']).toBe('absent');
        expect(result.letterStatuses['K']).toBe('absent');
    });
  });

  describe('addLetterToGuess', () => {
    it('should add a letter if currentGuess length is less than wordLength', () => {
      const state = initializeWordWiseState(5, 6, 'APPLE');
      state.currentGuess = 'APP';
      const newState = addLetterToGuess(state, 'L');
      expect(newState.currentGuess).toBe('APPL');
    });

    it('should not add a letter if currentGuess is full', () => {
      const state = initializeWordWiseState(5, 6, 'APPLE');
      state.currentGuess = 'APPLE';
      const newState = addLetterToGuess(state, 'E');
      expect(newState.currentGuess).toBe('APPLE');
    });
  });

  describe('removeLetterFromGuess', () => {
    it('should remove a letter if currentGuess is not empty', () => {
      const state = initializeWordWiseState(5, 6, 'APPLE');
      state.currentGuess = 'APPL';
      const newState = removeLetterFromGuess(state);
      expect(newState.currentGuess).toBe('APP');
    });

    it('should do nothing if currentGuess is empty', () => {
      const state = initializeWordWiseState(5, 6, 'APPLE');
      state.currentGuess = '';
      const newState = removeLetterFromGuess(state);
      expect(newState.currentGuess).toBe('');
    });
  });

  describe('getWordWiseForDate', () => {
    it('should return a word for a valid date in 2025', () => {
        const date = new Date(2025, 0, 15); // Jan 15, 2025
        const word = getWordWiseForDate(date);
        expect(word).toBe(wordWiseArchive2025[14]); // 0-indexed
        expect(typeof word).toBe('string');
    });

    it('should return null for a date outside 2025', () => {
        const date = new Date(2024, 0, 1);
        expect(getWordWiseForDate(date)).toBeNull();
        const date2 = new Date(2026, 0, 1);
        expect(getWordWiseForDate(date2)).toBeNull();
    });

    it('should return the first word for Jan 1, 2025', () => {
        const date = new Date(2025, 0, 1);
        expect(getWordWiseForDate(date)).toBe(wordWiseArchive2025[0]);
    });

    it('should return the last word for Dec 31, 2025', () => {
        const date = new Date(2025, 11, 31);
        // Assuming wordWiseArchive2025 has 365 words for a non-leap year
        expect(getWordWiseForDate(date)).toBe(wordWiseArchive2025[364]);
    });
  });
});
