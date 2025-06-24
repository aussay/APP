import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Animated, TouchableOpacity, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getDailyWordWiseWord, getDailyWordWiseChallengeKey } from '../utils/dailyChallengeHelper';
import { hasDailyChallengeBeenCompleted, loadStatistics } from '../store/statisticsService';
import { useIsFocused } from '@react-navigation/native';
import { Colors, FontSizes, Spacing, BorderRadius } from '../styles/theme';
import StreakReminder from '../components/StreakReminder';
import DailyChallengePopup from '../components/DailyChallengePopup';

type MainMenuScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'MainMenu'
>;

type Props = {
  navigation: MainMenuScreenNavigationProp;
};

const MainMenuScreen: React.FC<Props> = ({ navigation }) => {
  const [dailyWord, setDailyWord] = useState<string | null>(null);
  const [isDailyCompleted, setIsDailyCompleted] = useState(false);
  const [isLoadingDailyStatus, setIsLoadingDailyStatus] = useState(true);
  const [streaks, setStreaks] = useState<{ [key: string]: number }>({});
  const [showStreakReminder, setShowStreakReminder] = useState(false);
  const [showDailyPopup, setShowDailyPopup] = useState(false);
  const isFocused = useIsFocused();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true })
    ]).start();
  }, []);

  useEffect(() => {
    const fetchDailyChallengeInfo = async () => {
      setIsLoadingDailyStatus(true);
      const word = getDailyWordWiseWord();
      setDailyWord(word);
      const challengeKey = getDailyWordWiseChallengeKey();
      const completed = await hasDailyChallengeBeenCompleted(challengeKey);
      setIsDailyCompleted(completed);
      setIsLoadingDailyStatus(false);
    };
    const fetchStreaks = async () => {
      const stats = await loadStatistics();
      setStreaks({
        puzzleGrid: stats.puzzleGridStreak || 0,
        wordWise: stats.wordWiseStreak || 0,
        letterLogic: stats.letterLogicStreak || 0,
        linkUp: stats.linkUpStreak || 0,
        insight: stats.insightStreak || 0,
      });
    };
    if (isFocused) {
      fetchDailyChallengeInfo();
      // Show daily challenge popup if not completed
      if (!isDailyCompleted) {
        setShowDailyPopup(true);
      }
      // Show streak reminder if user is on a streak milestone
      if (streaks.wordWise === 3 || streaks.wordWise === 7 || streaks.wordWise === 30) {
        setShowStreakReminder(true);
      }
    }
    fetchStreaks();
  }, [isFocused]);

  const handlePlay = (screen: keyof RootStackParamList, params?: any) => {
    navigation.navigate(screen, params);
  };

  return (
    <>
      <DailyChallengePopup
        visible={showDailyPopup}
        onClose={() => setShowDailyPopup(false)}
        onStart={() => {
          setShowDailyPopup(false);
          handlePlay('WordWise', { isDailyChallenge: true, dailyWord });
        }}
        wordHint={dailyWord ? dailyWord[0] : undefined}
      />
      <StreakReminder visible={showStreakReminder} streak={streaks.wordWise} onClose={() => setShowStreakReminder(false)} />
      <Animated.ScrollView
        style={{ flex: 1, backgroundColor: Colors.background, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.titleContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
          <Text style={styles.title}>Puzzleverse</Text>
        </Animated.View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Daily Challenge</Text>
          {isLoadingDailyStatus ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.loadingIndicator} />
          ) : (
            <TouchableOpacity
              style={[styles.menuButton, isDailyCompleted && styles.menuButtonDisabled]}
              onPress={() => handlePlay('WordWise', { isDailyChallenge: true, dailyWord })}
              disabled={isDailyCompleted}
              activeOpacity={0.8}
            >
              <Text style={styles.menuButtonText}>{`Word Wise Daily ${isDailyCompleted ? "(Completed)" : ""}`}</Text>
              {dailyWord && <Text style={styles.dailyWordHint}>(Today's word starts with: {dailyWord[0]})</Text>}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Practice Games</Text>
          <TouchableOpacity style={styles.menuButton} onPress={() => handlePlay('PuzzleGrid')} activeOpacity={0.8}>
            <Text style={styles.menuButtonText}>Puzzle Grid</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={() => handlePlay('WordWise', { gameMode: 'classic' })} activeOpacity={0.8}>
            <Text style={styles.menuButtonText}>Word Wise (Practice)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={() => handlePlay('WordWiseAISetup')} activeOpacity={0.8}>
            <Text style={styles.menuButtonText}>Word Wise vs. AI</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={() => handlePlay('LetterLogic')} activeOpacity={0.8}>
            <Text style={styles.menuButtonText}>Letter Logic</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={() => handlePlay('LinkUp')} activeOpacity={0.8}>
            <Text style={styles.menuButtonText}>Link Up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={() => handlePlay('Insight')} activeOpacity={0.8}>
            <Text style={styles.menuButtonText}>Insight</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profile & Settings</Text>
          <TouchableOpacity style={styles.menuButton} onPress={() => handlePlay('UserProfile')} activeOpacity={0.8}>
            <Text style={styles.menuButtonText}>View Profile & Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={() => handlePlay('SettingsScreen')} activeOpacity={0.8}>
            <Text style={[styles.menuButtonText, { color: Colors.secondary }]}>Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Daily Streaks</Text>
          <Text style={styles.streakText}>Puzzle Grid: {streaks.puzzleGrid}  |  Word Wise: {streaks.wordWise}  |  Letter Logic: {streaks.letterLogic}  |  Link Up: {streaks.linkUp}  |  Insight: {streaks.insight}</Text>
        </View>
      </Animated.ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.large,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    marginTop: Spacing.large,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: FontSizes.header,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.medium,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.large,
    marginBottom: Spacing.medium,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  menuButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  menuButtonText: {
    fontSize: FontSizes.large,
    color: Colors.textLight,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  dailyWordHint: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginLeft: Spacing.small,
  },
  streakText: {
    fontSize: FontSizes.medium,
    color: Colors.secondary,
    marginTop: Spacing.small,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  loadingIndicator: {
    marginVertical: Spacing.large,
  },
});

export default MainMenuScreen;
