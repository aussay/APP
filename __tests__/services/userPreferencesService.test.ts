import AsyncStorageMock from '@react-native-async-storage/async-storage';
import {
  loadUserPreferences,
  saveSelectedAIGuide,
  markInitialGuideSelectionComplete,
  resetUserPreferences,
  UserPreferences,
} from '../../services/userPreferencesService'; // Adjust path if root is not project root for tests

const SELECTED_AI_GUIDE_KEY = 'Puzzleverse_SelectedAIGuide';
const HAS_SELECTED_GUIDE_KEY = 'Puzzleverse_HasSelectedGuide';

describe('userPreferencesService', () => {
  beforeEach(() => {
    // Clear the mock store before each test
    (AsyncStorageMock as any).__clearStore();
    // Reset mocks for spyOn
    jest.clearAllMocks();
  });

  describe('loadUserPreferences', () => {
    it('should return default preferences if nothing is stored', async () => {
      const preferences = await loadUserPreferences();
      expect(preferences).toEqual({
        selectedAIGuideId: null,
        hasMadeInitialGuideSelection: false,
      });
    });

    it('should return stored preferences', async () => {
      await AsyncStorageMock.setItem(SELECTED_AI_GUIDE_KEY, 'testGuide');
      await AsyncStorageMock.setItem(HAS_SELECTED_GUIDE_KEY, 'true');
      const preferences = await loadUserPreferences();
      expect(preferences).toEqual({
        selectedAIGuideId: 'testGuide',
        hasMadeInitialGuideSelection: true,
      });
    });

    it('should return hasMadeInitialGuideSelection as false if stored value is not "true"', async () => {
      await AsyncStorageMock.setItem(HAS_SELECTED_GUIDE_KEY, 'false');
      const preferences = await loadUserPreferences();
      expect(preferences.hasMadeInitialGuideSelection).toBe(false);
    });

    it('should return default preferences and log error if AsyncStorage.getItem fails', async () => {
      AsyncStorageMock.getItem = jest.fn().mockRejectedValueOnce(new Error('AsyncStorage GET failed'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const preferences = await loadUserPreferences();
      expect(preferences).toEqual({
        selectedAIGuideId: null,
        hasMadeInitialGuideSelection: false,
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to load user preferences:", expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('saveSelectedAIGuide', () => {
    it('should save the guide ID to AsyncStorage', async () => {
      await saveSelectedAIGuide('guide123');
      expect(AsyncStorageMock.setItem).toHaveBeenCalledWith(SELECTED_AI_GUIDE_KEY, 'guide123');
      expect((AsyncStorageMock as any).__getStore()[SELECTED_AI_GUIDE_KEY]).toBe('guide123');
    });

    it('should remove the guide ID if null is passed', async () => {
      await AsyncStorageMock.setItem(SELECTED_AI_GUIDE_KEY, 'guide123'); // Pre-populate
      await saveSelectedAIGuide(null);
      expect(AsyncStorageMock.removeItem).toHaveBeenCalledWith(SELECTED_AI_GUIDE_KEY);
      expect((AsyncStorageMock as any).__getStore()[SELECTED_AI_GUIDE_KEY]).toBeUndefined();
    });

    it('should log error if AsyncStorage.setItem fails', async () => {
        AsyncStorageMock.setItem = jest.fn().mockRejectedValueOnce(new Error('AsyncStorage SET failed'));
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await saveSelectedAIGuide('guide123');
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to save selected AI Guide ID:", expect.any(Error));
        consoleErrorSpy.mockRestore();
    });
  });

  describe('markInitialGuideSelectionComplete', () => {
    it('should set HAS_SELECTED_GUIDE_KEY to "true"', async () => {
      await markInitialGuideSelectionComplete();
      expect(AsyncStorageMock.setItem).toHaveBeenCalledWith(HAS_SELECTED_GUIDE_KEY, 'true');
      expect((AsyncStorageMock as any).__getStore()[HAS_SELECTED_GUIDE_KEY]).toBe('true');
    });

    it('should log error if AsyncStorage.setItem fails', async () => {
        AsyncStorageMock.setItem = jest.fn().mockRejectedValueOnce(new Error('AsyncStorage SET failed'));
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await markInitialGuideSelectionComplete();
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to mark initial guide selection:", expect.any(Error));
        consoleErrorSpy.mockRestore();
    });
  });

  describe('resetUserPreferences', () => {
    it('should remove both preference keys from AsyncStorage', async () => {
      await AsyncStorageMock.setItem(SELECTED_AI_GUIDE_KEY, 'testGuide');
      await AsyncStorageMock.setItem(HAS_SELECTED_GUIDE_KEY, 'true');

      await resetUserPreferences();

      expect(AsyncStorageMock.removeItem).toHaveBeenCalledWith(SELECTED_AI_GUIDE_KEY);
      expect(AsyncStorageMock.removeItem).toHaveBeenCalledWith(HAS_SELECTED_GUIDE_KEY);
      expect((AsyncStorageMock as any).__getStore()[SELECTED_AI_GUIDE_KEY]).toBeUndefined();
      expect((AsyncStorageMock as any).__getStore()[HAS_SELECTED_GUIDE_KEY]).toBeUndefined();
    });

    it('should log error if AsyncStorage.removeItem fails', async () => {
        AsyncStorageMock.removeItem = jest.fn().mockRejectedValueOnce(new Error('AsyncStorage REMOVE failed'));
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await resetUserPreferences();
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to reset user preferences:", expect.any(Error));
        consoleErrorSpy.mockRestore();
    });
  });
});
