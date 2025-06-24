import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainMenuScreen from '../screens/MainMenuScreen';
// Import game screens - will create these next
import PuzzleGridScreen from '../games/puzzle_grid/PuzzleGridScreen';
import WordWiseScreen from '../games/word_wise/WordWiseScreen';
import LetterLogicScreen from '../games/letter_logic/LetterLogicScreen';
import LinkUpScreen from '../games/link_up/LinkUpScreen';
import InsightScreen from '../games/insight/InsightScreen';
import SettingsScreen from '../screens/SettingsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import WordWiseAISetupScreen from '../screens/WordWiseAISetupScreen';
import GuideSelectionScreen from '../screens/GuideSelectionScreen';

// Define the parameter list for the stack navigator
export type RootStackParamList = {
  MainMenu: undefined;
  PuzzleGrid: undefined; // No params for now
  WordWise: {
    isDailyChallenge?: boolean;
    dailyWord?: string;
    gameMode?: 'classic' | 'versusAI'; // Added gameMode
    aiBotId?: string; // Added aiBotId
  } | undefined;
  LetterLogic: undefined;
  LinkUp: undefined;
  Insight: undefined;
  UserProfile: undefined;
  WordWiseAISetup: undefined;
  SettingsScreen: undefined; // New settings screen
  GuideSelectionScreen: { isFirstLaunch?: boolean }; // New guide selection screen, optional param
  // Add other screens/params here as needed
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainMenu"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#121212', // Dark background for the header
        },
        headerTintColor: '#BB86FC', // Electric blue color for header text and icons
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="MainMenu"
        component={MainMenuScreen}
        options={{ title: 'Puzzleverse Menu' }}
      />
      <Stack.Screen
        name="PuzzleGrid"
        component={PuzzleGridScreen} // Placeholder
        options={{ title: 'Puzzle Grid' }}
      />
      <Stack.Screen
        name="WordWise"
        component={WordWiseScreen} // Placeholder
        options={{ title: 'Word Wise' }}
      />
      <Stack.Screen
        name="LetterLogic"
        component={LetterLogicScreen} // Placeholder
        options={{ title: 'Letter Logic' }}
      />
      <Stack.Screen
        name="LinkUp"
        component={LinkUpScreen} // Placeholder
        options={{ title: 'Link Up' }}
      />
      <Stack.Screen
        name="Insight"
        component={InsightScreen}
        options={{ title: 'Insight' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ title: 'Your Profile' }}
      />
      <Stack.Screen
        name="WordWiseAISetup"
        component={WordWiseAISetupScreen}
        options={{ title: 'Choose AI Opponent' }}
      />
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="GuideSelectionScreen"
        component={GuideSelectionScreen} // To be created
        options={{ title: 'Select Your AI Guide' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;

// Update navigation bar to use a dark background and electric blue for active icons
// Use geometric, line-based icons from @expo/vector-icons
