import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import GuideSelectionScreen from '../screens/GuideSelectionScreen'; // Assuming path
import { RootStackParamList } from './AppNavigator'; // Use the same param list for consistency

// Create a new stack navigator specifically for the initial guide selection flow
// It will only contain the GuideSelectionScreen.
const GuideStack = createStackNavigator<Pick<RootStackParamList, 'GuideSelectionScreen' | 'MainMenu'>>();
// We include MainMenu here because GuideSelectionScreen might replace itself with MainMenu

const GuideSelectionNavigator: React.FC = () => {
  return (
    <GuideStack.Navigator>
      <GuideStack.Screen
        name="GuideSelectionScreen"
        component={GuideSelectionScreen}
        initialParams={{ isFirstLaunch: true }} // Pass param to indicate it's the first launch flow
        options={{ headerShown: false }} // No header for this initial screen
      />
      {/*
        The MainMenu screen is implicitly available if GuideSelectionScreen uses navigation.replace('MainMenu').
        No need to explicitly declare it here unless it's part of a direct navigation path *within* this specific navigator,
        which it isn't; GuideSelectionScreen transitions *out* of this navigator flow.
      */}
    </GuideStack.Navigator>
  );
};

export default GuideSelectionNavigator;
