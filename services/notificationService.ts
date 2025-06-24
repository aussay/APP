import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadStatistics } from '../store/statisticsService';

const NOTIFICATION_PERMISSIONS_KEY = 'Puzzleverse_NotificationPermissionsGranted';

// --- Permission Handling ---
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  let token: string | null = null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      //   Alert.alert('Failed to get push token for push notification!'); // Inform user
      await AsyncStorage.setItem(NOTIFICATION_PERMISSIONS_KEY, 'false');
      console.log('Notification permissions denied.');
      return null;
    }
    // Learn more about projectId:
    // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    // token = (await Notifications.getExpoPushTokenAsync({ projectId: 'YOUR_PROJECT_ID' })).data;
    // For now, as we don't have a projectId and are focusing on local notifications,
    // we'll simulate token generation or skip it.
    // This token would be sent to your backend.
    console.log('Notification permissions granted. ExpoPushToken would be generated here if projectId was set.');
    // Use real Expo push token logic for production
    token = (await Notifications.getExpoPushTokenAsync({ projectId: '1b67dc9b-8146-4c88-bda0-f6cc2ffc0da2' })).data;
  } else {
    // Alert.alert('Must use physical device for Push Notifications');
    console.log('Push notifications require a physical device.');
  }
  return token;
};

export const hasNotificationPermissions = async (): Promise<boolean> => {
    const storedPermission = await AsyncStorage.getItem(NOTIFICATION_PERMISSIONS_KEY);
    if (storedPermission === 'true') return true;
    if (storedPermission === 'false') return false;

    // If not stored, check system permissions
    const { status } = await Notifications.getPermissionsAsync();
    const granted = status === 'granted';
    await AsyncStorage.setItem(NOTIFICATION_PERMISSIONS_KEY, granted ? 'true' : 'false');
    return granted;
};


// --- Local Notification Scheduling ---

// Daily Puzzle Reminder (e.g., for 9 AM every day)
export const scheduleDailyPuzzleReminder = async (): Promise<void> => {
  const enabled = await hasNotificationPermissions();
  if (!enabled) {
    console.log("Cannot schedule daily reminder: notifications disabled.");
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync(); // Clear previous daily reminders

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🧩 Puzzleverse Daily!",
        body: "Your new set of daily puzzles is ready. Dive in!",
        data: { type: 'daily_reminder' }, // Optional data to handle notification tap
        sound: 'default', // Use a default sound
      },
      trigger: {
        hour: 9, // 9 AM
        minute: 0,
        repeats: true, // Repeat daily at this time
        type: 'daily' as any, // workaround for Expo type mismatch
      },
    });
    console.log('Daily puzzle reminder scheduled for 9 AM.');
  } catch (error) {
    console.error("Failed to schedule daily reminder:", error);
  }
};

// Streak Saver Notification
// This needs to know the last play date to schedule appropriately.
export const scheduleStreakSaverNotification = async (lastStreakUpdateDateStr: string | null): Promise<void> => {
  const enabled = await hasNotificationPermissions();
  if (!enabled) {
    console.log("Cannot schedule streak saver: notifications disabled.");
    return;
  }

  // Clear any existing streak saver notifications to avoid duplicates
  // This requires a way to identify streak saver notifications, e.g., by an identifier.
  // For simplicity, we might cancel all then reschedule, or use a known ID.
  // Let's assume we cancel all of a specific identifier if we had one.
  // For now, this will just schedule a new one. Consider more robust cancellation.
  // await Notifications.cancelScheduledNotificationAsync('streak_saver_id'); // Example

  if (!lastStreakUpdateDateStr) {
    // No streak to save yet, or user just started.
    return;
  }

  const today = new Date();
  const lastPlay = new Date(lastStreakUpdateDateStr);

  const diffTime = Math.abs(today.setHours(0,0,0,0) - lastPlay.setHours(0,0,0,0)); // Compare dates only
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Played today, no streak saver needed for today.
    // Schedule one for tomorrow evening if they don't play tomorrow.
    // This logic gets complex quickly.
    // A simpler approach: if they played yesterday, and it's now evening and they haven't played today, send.
    // For a proactive scheduler: if last play was yesterday, schedule for this evening.
    // If last play was today, don't schedule for today.
    console.log("Played today, no streak saver needed for today.");
    return;
  }

  // If diffDays >= 1, means they haven't played today.
  // Schedule for this evening (e.g., 7 PM) if it's not already past 7 PM.
  // Or, more simply, if they missed a day, the streak is already broken by next check.
  // This notification is more of a "reminder to play today to continue streak"
  // rather than "your streak *will* break".

  // Simplified: If they haven't played today, and it's before, say, 7 PM, schedule a reminder for 7 PM.
  // This logic should ideally run once per day, e.g., on app open.

  // For this task, let's just schedule a generic "don't lose your streak" if it's been > 24hrs.
  // The actual timing and condition would be refined.

  // Example: Schedule a notification for 20 hours after the last play if no new play.
  // This means if they play at 9 AM, a reminder could trigger at 5 AM next day if they haven't played.
  // This is just one way to approach it.

  const triggerTime = new Date(lastPlay.getTime() + 20 * 60 * 60 * 1000); // 20 hours after last play

  if (triggerTime > new Date()) { // Only schedule if in the future
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🔥 Don't Lose Your Streak!",
            body: "Come back and solve a daily puzzle to keep your streak alive!",
            data: { type: 'streak_saver' },
            sound: 'default',
          },
          trigger: {
            seconds: Math.max(1, Math.floor((triggerTime.getTime() - Date.now()) / 1000)),
            repeats: false,
            type: 'timeInterval' as any, // workaround for Expo type mismatch
          },
        });
        console.log(`Streak saver notification scheduled for ${triggerTime}.`);
      } catch (error) {
        console.error("Failed to schedule streak saver notification:", error);
      }
  } else {
    console.log("Streak saver trigger time is in the past, not scheduling.");
  }
};

// Call this on app startup, perhaps after a delay or user interaction
export const initializeNotifications = async () => {
    const permissionsGranted = await registerForPushNotificationsAsync();
    if (permissionsGranted) {
        await scheduleDailyPuzzleReminder();

        try {
            const stats = await loadStatistics();
            if (stats && stats.currentStreak > 0 && stats.lastStreakUpdateDate) {
               await scheduleStreakSaverNotification(stats.lastStreakUpdateDate);
            } else {
                // console.log("No active streak or last play date, not scheduling streak saver."); // DEBUG
            }
        } catch (error) {
            console.error("Error loading stats for streak saver scheduling:", error);
        }
    }
};

// To be called when app is foregrounded to re-evaluate streak saver
export const refreshStreakSaverNotification = async (lastStreakUpdateDateStr: string | null) => {
    // Potentially cancel existing streak savers and reschedule based on current time and last play
    // For now, this is a placeholder for more complex logic
    // console.log("Refreshing streak saver notification logic based on:", lastStreakUpdateDateStr);
    // scheduleStreakSaverNotification(lastStreakUpdateDateStr); // Could be too aggressive
};
