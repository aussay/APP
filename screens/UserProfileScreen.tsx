import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Button, Animated, Dimensions } from 'react-native';
import { AppStatistics, GameKey } from '../types/statistics';
import { Achievement } from '../types/achievements';
import { loadStatistics, resetStatistics } from '../store/statisticsService';
import { getAllAchievements, resetAchievementProgress } from '../store/achievementService';
import { Colors, FontSizes, Spacing, BorderRadius } from '../styles/theme';
import { defaultGameStats } from '../types/statistics'; // Import defaultGameStats for fallback
import { BarChart, LineChart } from 'react-native-chart-kit'; // Import chart components

const calculateOverallWinPercentage = (statistics: AppStatistics | null): string => {
  if (!statistics || statistics.totalGamesPlayed === 0) {
    return '0.0%';
  }
  let totalWins = 0;
  Object.values(GameKey).forEach(gameKey => {
    totalWins += statistics[gameKey]?.gamesWon || 0;
  });
  return ((totalWins / statistics.totalGamesPlayed) * 100).toFixed(1) + '%';
};

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const animatedValue = React.useRef(new Animated.Value(value)).current;
  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [value]);
  const [displayValue, setDisplayValue] = React.useState(value);
  animatedValue.addListener(({ value }) => setDisplayValue(Math.round(value)));
  return <Text style={{ fontWeight: 'bold', fontSize: 22, color: '#007AFF' }}>{displayValue}</Text>;
};

const UserProfileScreen: React.FC = () => {
  const [stats, setStats] = useState<AppStatistics | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    const loadedStats = await loadStatistics();
    setStats(loadedStats);
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleResetStats = async () => {
    await resetStatistics();
    fetchStats(); // Refresh stats on screen
  }

  if (loading || !stats) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const gameDisplayNames: Record<GameKey, string> = {
    [GameKey.PUZZLE_GRID]: "Puzzle Grid",
    [GameKey.WORD_WISE]: "Word Wise",
    [GameKey.LETTER_LOGIC]: "Letter Logic",
    [GameKey.LINK_UP]: "Link Up",
    [GameKey.INSIGHT]: "Insight",
  };

  // Prepare data for charts
  const screenWidth = Dimensions.get('window').width;
  const barChartConfig = {
    backgroundColor: Colors.surface,
    backgroundGradientFrom: Colors.surface,
    backgroundGradientTo: Colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: Colors.surface,
    },
  };
  const lineChartConfig = {
    backgroundColor: Colors.surface,
    backgroundGradientFrom: Colors.surface,
    backgroundGradientTo: Colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  // Sample data for charts (replace with real data)
  const gamesWonVsPlayedData = {
    labels: Object.values(GameKey).map(key => gameDisplayNames[key]),
    datasets: [
      {
        data: Object.values(GameKey).map(key => stats[key]?.gamesWon || 0),
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, // Custom color for bars
      },
      {
        data: Object.values(GameKey).map(key => stats[key]?.gamesPlayed || 0),
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // Custom color for bars
      },
    ],
  };
  const dailyStreakHistory = stats.dailyStreakHistory ?? [];
  const dailyStreakHistoryData = {
    labels: dailyStreakHistory.map((_: any, index: number) => `Day ${index + 1}`),
    datasets: [
      {
        data: dailyStreakHistory,
        strokeWidth: 2,
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, // Custom color for line
      },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>User Profile & Statistics</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Stats</Text>
        <Text style={styles.statItem}>Total Games Played: {stats.totalGamesPlayed}</Text>
        <Text style={styles.statItem}>Overall Win %: {calculateOverallWinPercentage(stats)}</Text>
        <Text style={styles.statItem}>Current Daily Streak: {stats.currentStreak} day(s)</Text>
        <Text style={styles.statItem}>Longest Daily Streak: {stats.longestStreak} day(s)</Text>
        {stats.lastStreakUpdateDate && <Text style={styles.statItemSmall}>Last Streak Update: {stats.lastStreakUpdateDate}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Game-Specific Stats</Text>
        {Object.values(GameKey).map(gameKey => {
          const gameStat = stats[gameKey] || defaultGameStats;
          const averageSolveTime = gameStat.gamesCompletedForTimeStats > 0
            ? (gameStat.totalSolveTime / gameStat.gamesCompletedForTimeStats).toFixed(1) + 's'
            : 'N/A';
          return (
            <View key={gameKey} style={styles.gameStatBlock}>
              <Text style={styles.gameStatTitle}>{gameDisplayNames[gameKey]}</Text>
              <Text style={styles.statItem}>Played: {gameStat.gamesPlayed}</Text>
              <Text style={styles.statItem}>Won: {gameStat.gamesWon}</Text>
              <Text style={styles.statItem}>Win Rate: {gameStat.gamesPlayed > 0 ? ((gameStat.gamesWon / gameStat.gamesPlayed) * 100).toFixed(1) : '0.0'}%</Text>
              <Text style={styles.statItem}>Avg. Solve Time (wins): {averageSolveTime}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress Visualization</Text>
        {/* Replace placeholder chart with real analytics bar chart */}
        <BarChart
          data={gamesWonVsPlayedData}
          width={screenWidth - 32}
          height={220}
          yAxisLabel={''}
          yAxisSuffix={''}
          chartConfig={barChartConfig}
          style={styles.chart}
        />
        {/* Replace placeholder line chart with real streak history chart */}
        <LineChart
          data={dailyStreakHistoryData}
          width={screenWidth - 32}
          height={180}
          chartConfig={lineChartConfig}
          style={styles.chart}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements ({achievements.filter(a => a.isUnlocked).length}/{achievements.length})</Text>
        {achievements.length === 0 && <Text style={styles.placeholderText}>No achievements defined yet.</Text>}

        {/* Group achievements by category for display */}
        {(Object.keys(GameKey) as Array<keyof typeof GameKey>).map(categoryKeyVal => {
          const category = GameKey[categoryKeyVal];
          const categoryAchievements = achievements.filter(ach => ach.category === category);
          if (categoryAchievements.length === 0) return null;

          return (
            <View key={category} style={styles.achievementGroup}>
              <Text style={styles.achievementCategoryTitle}>{gameDisplayNames[category]}</Text>
              {categoryAchievements.map(ach => (
                <View key={ach.id} style={[styles.achievementItem, ach.isUnlocked ? styles.unlockedAchievement : styles.lockedAchievement]}>
                  <Text style={styles.achievementIcon}>{ach.iconName}</Text>
                  <View style={styles.achievementTextContainer}>
                    <Text style={styles.achievementName}>{ach.name}</Text>
                    <Text style={styles.achievementDescription}>{ach.description}</Text>
                    {ach.isUnlocked && ach.unlockedDate && ( <Text style={styles.achievementDate}>Unlocked: {ach.unlockedDate}</Text> )}
                  </View>
                </View>
              ))}
            </View>
          );
        })}
        {/* General Achievements */}
        {achievements.filter(ach => ach.category === 'general').length > 0 && (
            <View style={styles.achievementGroup}>
                <Text style={styles.achievementCategoryTitle}>General</Text>
                {achievements.filter(ach => ach.category === 'general').map(ach => (
                    <View key={ach.id} style={[styles.achievementItem, ach.isUnlocked ? styles.unlockedAchievement : styles.lockedAchievement]}>
                    <Text style={styles.achievementIcon}>{ach.iconName}</Text>
                    <View style={styles.achievementTextContainer}>
                        <Text style={styles.achievementName}>{ach.name}</Text>
                        <Text style={styles.achievementDescription}>{ach.description}</Text>
                        {ach.isUnlocked && ach.unlockedDate && ( <Text style={styles.achievementDate}>Unlocked: {ach.unlockedDate}</Text> )}
                    </View>
                    </View>
                ))}
            </View>
        )}
      </View>

      <View style={[styles.section, styles.dangerZone]}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <Button title="Reset All Statistics & Achievements" onPress={handleResetStats} color={Colors.error} />
        <Text style={styles.statItemSmall}>Warning: This action is irreversible.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.large, // Use theme spacing
    backgroundColor: Colors.background, // Use theme background
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.medium,
    fontSize: FontSizes.large,
    color: Colors.textSecondary,
  },
  header: {
    fontSize: FontSizes.title,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    color: Colors.primary, // Use theme color
  },
  section: {
    marginBottom: Spacing.xl,
    padding: Spacing.large,
    backgroundColor: Colors.surface, // Use theme surface color
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.border, // Use theme border color
  },
  sectionTitle: {
    fontSize: FontSizes.header,
    fontWeight: '600',
    marginBottom: Spacing.medium,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.small,
  },
  statItem: {
    fontSize: FontSizes.large,
    marginBottom: Spacing.small,
    color: Colors.textPrimary,
  },
  statItemSmall: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  gameStatBlock: {
    marginBottom: Spacing.medium,
    paddingBottom: Spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  gameStatTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '500',
    color: Colors.secondary,
    marginBottom: Spacing.xs,
  },
  placeholderText: { // Keep for "No achievements" message
    fontSize: FontSizes.large,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.medium,
  },
  achievementGroup: { // Added for grouping
    marginBottom: Spacing.medium,
  },
  achievementCategoryTitle: {
    fontSize: FontSizes.large, // Changed from xl to large
    fontWeight: 'bold', // Make it bold
    color: Colors.textSecondary, // Use secondary text color
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
    paddingLeft: Spacing.small,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  achievementItem_last: {
    borderBottomWidth: 0,
  },
  unlockedAchievement: {
    // backgroundColor: Colors.success + '10', // Optional: very subtle tint
  },
  lockedAchievement: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: FontSizes.xxxl, // Adjusted size
    marginRight: Spacing.medium,
    width: FontSizes.xxxl + Spacing.small,
    textAlign: 'center',
  },
  achievementTextContainer: {
    flex: 1,
  },
  achievementName: {
    fontSize: FontSizes.large,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  achievementDescription: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  achievementDate: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  dangerZone: {
      borderColor: Colors.error,
      backgroundColor: Colors.error + '10',
  },
  chart: {
    borderRadius: 16,
    marginBottom: Spacing.medium,
  },
});

export default UserProfileScreen;
