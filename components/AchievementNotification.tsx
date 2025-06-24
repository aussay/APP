import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius } from '../styles/theme';
import { Achievement } from '../types/achievements';
import Confetti from './Confetti';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({ achievement, onDismiss }) => {
  const [fadeAnim] = useState(new Animated.Value(0)); // Initial value for opacity: 0
  const [slideAnim] = useState(new Animated.Value(-100)); // Initial value for Y-position: -100 (off-screen top)
  const [confettiVisible, setConfettiVisible] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (achievement) {
      setConfettiVisible(true);
      // Play haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Play sound
      (async () => {
        try {
          const { sound } = await Audio.Sound.createAsync(
            require('../assets/success-chime.mp3'),
            { shouldPlay: true }
          );
          // Unload sound after playing
          sound.setOnPlaybackStatusUpdate(status => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync();
            }
          });
        } catch (e) { /* ignore */ }
      })();
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, { // Spring animation for slide-in
          toValue: Spacing.large, // Slide to final position
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();

      // Automatically dismiss after a few seconds
      const timer = setTimeout(() => {
        setConfettiVisible(false);
        handleDismiss();
      }, 4000); // Display for 4 seconds

      return () => clearTimeout(timer);
    }
  }, [achievement]);

  const handleDismiss = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100, // Slide back off-screen
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(); // Call onDismiss after animation completes
    });
  };

  const handleTryAnotherGame = () => {
    // Suggest a random game different from the current one
    const games = [
      { name: 'Puzzle Grid', screen: 'PuzzleGrid' },
      { name: 'Word Wise', screen: 'WordWise' },
      { name: 'Letter Logic', screen: 'LetterLogic' },
      { name: 'Link Up', screen: 'LinkUp' },
      { name: 'Insight', screen: 'Insight' },
    ];
    const suggestion = games[Math.floor(Math.random() * games.length)];
    // Use navigation.navigate with correct type signature
    // @ts-ignore
    navigation.navigate(suggestion.screen as never);
    onDismiss();
  };

  if (!achievement) {
    return null;
  }

  return (
    <>
      <Confetti visible={confettiVisible} />
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity onPress={handleDismiss} style={styles.touchableContent}>
          <MaterialIcons name="star" size={FontSizes.xxxl + Spacing.small} color={Colors.primary} style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={styles.title}>Achievement Unlocked!</Text>
            <Text style={styles.name}>{achievement.name}</Text>
            <Text style={styles.description}>{achievement.description}</Text>
            <TouchableOpacity onPress={handleTryAnotherGame} style={{ marginTop: 12, backgroundColor: '#eee', borderRadius: 8, padding: 8 }}>
              <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Try Another Game!</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Spacing.large, // Adjust as needed, e.g., below status bar
    left: Spacing.medium,
    right: Spacing.medium,
    backgroundColor: Colors.surface,
    padding: Spacing.medium,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.accent, // Use accent color for border
    elevation: 10, // Android shadow
    shadowColor: Colors.textPrimary, // iOS shadow
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000, // Ensure it's on top
  },
  touchableContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: Spacing.medium,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: Colors.accent, // Accent color for title
  },
  name: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  description: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});

export default AchievementNotification;
