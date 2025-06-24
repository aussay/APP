import { GameKey } from "../types/statistics";
import { Guess as WordWiseGuess, LetterFeedback as WordWiseLetterFeedback } from "../games/word_wise/types";

export interface ShareData {
  message: string; // The main text to share
  title?: string;   // Optional title for the share dialog
  url?: string;     // Optional URL to share (e.g., link to the app)
}

const APP_HASHTAG = "#Puzzleverse";
// const APP_URL = "https://example.com/puzzleverse"; // Replace with actual app URL if available

const feedbackToEmoji = (feedback: WordWiseLetterFeedback): string => {
    switch (feedback) {
        case 'correct': return '🟩';
        case 'present': return '🟨';
        case 'absent': return '⬜'; // Or ⬛ for black square
        default: return '❔';
    }
};

export const generateWordWiseShareMessage = (
    guesses: WordWiseGuess[],
    didWin: boolean,
    targetWord: string, // For context, though not directly shared if spoilery
    puzzleNumber?: number | string // e.g., daily puzzle number
): ShareData => {
    let gridRepresentation = guesses.map(guess =>
        guess.feedback.map(feedbackToEmoji).join('')
    ).join('\n');

    const guessCount = didWin ? guesses.length : 'X';
    const maxGuesses = guesses[0]?.feedback.length > 0 ? initializeWordWiseState(undefined, undefined, targetWord).maxGuesses : 6; // Bit of a hack to get maxGuesses if not passed

    let title = `Puzzleverse - Word Wise`;
    if (puzzleNumber) title += ` #${puzzleNumber}`;

    const message = `${title}\n${guessCount}/${maxGuesses}\n\n${gridRepresentation}\n\n${APP_HASHTAG}`;
    return { message, title };
};


export const generatePuzzleGridShareMessage = (
    puzzleTitle: string,
    isComplete: boolean,
    solveTimeInSeconds?: number
): ShareData => {
    let message = `Puzzleverse - Puzzle Grid "${puzzleTitle}"`;
    if (isComplete) {
        message += " solved!";
        if (solveTimeInSeconds) {
            const minutes = Math.floor(solveTimeInSeconds / 60);
            const seconds = Math.floor(solveTimeInSeconds % 60);
            message += ` In ${minutes > 0 ? `${minutes}m ` : ''}${seconds}s.`;
        }
    } else {
        message += " progress."; // Or some other status
    }
    return { message: `${message}\n\n${APP_HASHTAG}`, title: "Puzzle Grid Result" };
};

export const generateLetterLogicShareMessage = (
    score: number,
    wordsFoundCount: number,
    pangramsFoundCount: number,
    puzzleName?: string // e.g. "Daily Letters"
): ShareData => {
    let message = `Puzzleverse - Letter Logic`;
    if (puzzleName) message += ` (${puzzleName})`;
    message += `: Scored ${score} points finding ${wordsFoundCount} words!`;
    if (pangramsFoundCount > 0) {
        message += ` Including ${pangramsFoundCount} pangram${pangramsFoundCount > 1 ? 's' : ''}!`;
    }
    return { message: `${message}\n\n${APP_HASHTAG}`, title: "Letter Logic Result" };
};

export const generateLinkUpShareMessage = (
    categoriesFound: number,
    totalCategories: number,
    mistakesMade: number,
    didWin: boolean
): ShareData => {
    let message = `Puzzleverse - Link Up: `;
    if (didWin) {
        message += `Solved all ${totalCategories} categories with ${mistakesMade} mistake${mistakesMade === 1 ? '' : 's'}!`;
    } else {
        message += `Found ${categoriesFound}/${totalCategories} categories.`;
    }
    return { message: `${message}\n\n${APP_HASHTAG}`, title: "Link Up Result" };
};

export const generateInsightShareMessage = (
    puzzleTitle: string,
    isComplete: boolean,
    solveTimeInSeconds?: number
): ShareData => {
    let message = `Puzzleverse - Insight "${puzzleTitle}"`;
    if (isComplete) {
        message += " solved!";
        if (solveTimeInSeconds) {
            const minutes = Math.floor(solveTimeInSeconds / 60);
            const seconds = Math.floor(solveTimeInSeconds % 60);
            message += ` In ${minutes > 0 ? `${minutes}m ` : ''}${seconds}s.`;
        }
    } else {
        message += " progress.";
    }
    return { message: `${message}\n\n${APP_HASHTAG}`, title: "Insight Result" };
};

// Helper function from WordWise logic, simplified here or should be imported if complex
// For now, this is a placeholder as the actual initializeWordWiseState is in its logic file
// and contains more than just maxGuesses.
// This local version is just for the share message generation.
const initializeWordWiseState = (wordLength?:number, maxGuesses?:number, targetWord?:string) => {
    return { maxGuesses: maxGuesses || 6, wordLength: wordLength || 5 };
};

// --- React Native Share API Integration ---
import { Share } from 'react-native';

export const shareGameResult = async (shareData: ShareData): Promise<void> => {
  try {
    const result = await Share.share({
      message: shareData.message,
      title: shareData.title,
      // url: shareData.url || APP_URL, // Uncomment if APP_URL is defined
    });

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        // Shared with activity type of result.activityType
        console.log(`Shared via ${result.activityType}`);
      } else {
        // Shared
        console.log("Shared successfully");
      }
    } else if (result.action === Share.dismissedAction) {
      // Dismissed
      console.log("Share dismissed");
    }
  } catch (error: any) {
    console.error("Error sharing:", error.message);
    // Optionally, show an alert to the user
    // Alert.alert("Share Error", "Could not share your result at this time.");
  }
};
