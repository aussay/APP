import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, StyleSheet } from 'react-native'; // For loading state
import AppNavigator from './navigation/AppNavigator'; // Main navigator after guide selection
import { AchievementNotificationProvider } from './context/AchievementNotificationContext';
import { initializeNotifications } from './services/notificationService';
import * as Notifications from 'expo-notifications';
import { loadUserPreferences } from './services/userPreferencesService'; // Path assuming services is under src
import aiSimulatorInstance from './ai/AISimulator'; // Path assuming ai is under src
import { Colors } from './styles/theme'; // For loading indicator color

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [hasSelectedGuide, setHasSelectedGuide] = useState(false);
  const [initialGuideId, setInitialGuideId] = useState<string | null>(null);

  useEffect(() => {
    // initializeNotifications(); // Initialize notification permissions and listeners // DIAGNOSTIC: Temporarily commented out to isolate crash
    console.log('[DIAGNOSTIC] initializeNotifications() is currently commented out.');


    const checkPreferencesAndSetup = async () => {
      const prefs = await loadUserPreferences();
      setHasSelectedGuide(!!prefs.selectedAIGuideId); // Only track if a guide is set
      if (prefs.selectedAIGuideId) {
        aiSimulatorInstance.setActivePersonality(prefs.selectedAIGuideId);
        setInitialGuideId(prefs.selectedAIGuideId);
      }
      setIsLoadingPreferences(false);
    };
    checkPreferencesAndSetup();

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification Response:', response);
      // TODO: Handle notification tap navigation
    });
    return () => { responseSubscription.remove(); };
  }, []);

  if (isLoadingPreferences) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AchievementNotificationProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AchievementNotificationProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  }
});
