import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_AI_GUIDE_KEY = 'Puzzleverse_SelectedAIGuide';
const HAS_SELECTED_GUIDE_KEY = 'Puzzleverse_HasSelectedGuide'; // To track if initial selection has been made

export interface UserPreferences {
  selectedAIGuideId: string | null;
  hasMadeInitialGuideSelection: boolean;
}

export const loadUserPreferences = async (): Promise<UserPreferences> => {
  try {
    const guideId = await AsyncStorage.getItem(SELECTED_AI_GUIDE_KEY);
    const hasSelected = await AsyncStorage.getItem(HAS_SELECTED_GUIDE_KEY);
    return {
      selectedAIGuideId: guideId,
      hasMadeInitialGuideSelection: hasSelected === 'true',
    };
  } catch (error) {
    console.error("Failed to load user preferences:", error);
    return { selectedAIGuideId: null, hasMadeInitialGuideSelection: false };
  }
};

export const saveSelectedAIGuide = async (guideId: string | null): Promise<void> => {
  try {
    if (guideId) {
      await AsyncStorage.setItem(SELECTED_AI_GUIDE_KEY, guideId);
    } else {
      await AsyncStorage.removeItem(SELECTED_AI_GUIDE_KEY);
    }
    // console.log(`Saved selected AI Guide ID: ${guideId}`); // DEBUG
  } catch (error) {
    console.error("Failed to save selected AI Guide ID:", error);
  }
};

export const markInitialGuideSelectionComplete = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(HAS_SELECTED_GUIDE_KEY, 'true');
        // console.log("Initial guide selection marked as complete."); // DEBUG
    } catch (error) {
        console.error("Failed to mark initial guide selection:", error);
    }
};

export const resetUserPreferences = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(SELECTED_AI_GUIDE_KEY);
        await AsyncStorage.removeItem(HAS_SELECTED_GUIDE_KEY);
        // console.log("User preferences reset."); // DEBUG
    } catch (error) {
        console.error("Failed to reset user preferences:", error);
    }
};
