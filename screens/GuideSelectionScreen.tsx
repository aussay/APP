import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Button } from 'react-native'; // Added Button
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import aiSimulatorInstance from '../ai/AISimulator';
import { AIPersonality } from '../ai/types';
import { saveSelectedAIGuide, markInitialGuideSelectionComplete, loadUserPreferences } from '../services/userPreferencesService';
import { Colors, FontSizes, Spacing, BorderRadius } from '../styles/theme';
import analyticsService from '../services/analyticsService'; // Import analytics service

type GuideSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GuideSelectionScreen'>;
type GuideSelectionScreenRouteProp = RouteProp<RootStackParamList, 'GuideSelectionScreen'>;

type Props = {
  navigation: GuideSelectionScreenNavigationProp;
  route: GuideSelectionScreenRouteProp;
};

// Descriptions for the 7 new guides (Project Chimera)
const guideDescriptions: Record<string, string> = {
  oracle: "Mysterious and insightful, offers cryptic clues and foresees your struggles.",
  dude: "Chill and laid-back, provides casual encouragement and a touch of humor.",
  glitch: "Unpredictable and chaotic, might offer surprisingly helpful or hilariously unhelpful advice.",
  monolith: "Austere and profound, gives minimalist guidance that makes you think.",
  cheerleader: "Full of energy and positivity, celebrates every small win with enthusiasm.",
  rival: "Competitive and taunting, challenges you to prove you're better than it.",
  mentor: "Wise and patient, offers constructive feedback and helps you learn from mistakes.",
};

const newGuideIds = ['oracle', 'dude', 'glitch', 'monolith', 'cheerleader', 'rival', 'mentor'];

const GuideSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const [guides, setGuides] = useState<AIPersonality[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isFirstLaunch = route.params?.isFirstLaunch || false;

  useEffect(() => {
    const allPersonalities = aiSimulatorInstance.getAllPersonalities();
    const projectChimeraGuides = allPersonalities.filter(p => newGuideIds.includes(p.id));
    setGuides(projectChimeraGuides);

    loadUserPreferences().then(prefs => {
      setSelectedGuideId(prefs.selectedAIGuideId);
      setIsLoading(false);
    });
  }, []);

  const handleSelectGuide = async (guide: AIPersonality) => {
    setSelectedGuideId(guide.id);
    await saveSelectedAIGuide(guide.id);
    aiSimulatorInstance.setActivePersonality(guide.id); // Update active personality in the simulator

    if (isFirstLaunch) {
      await markInitialGuideSelectionComplete();
      // Navigate to MainMenu, replacing the GuideSelectionScreen in the stack
      navigation.replace('MainMenu');
    } else {
      // Could show a confirmation or just navigate back
      navigation.goBack();
    }
  };

  const renderGuideItem = ({ item }: { item: AIPersonality }) => (
    <TouchableOpacity
      style={[
        styles.guideButton,
        selectedGuideId === item.id && styles.selectedGuideButton
      ]}
      onPress={() => handleSelectGuide(item)}
    >
      <Text style={styles.guideName}>{item.name}</Text>
      <Text style={styles.guideDescription}>{guideDescriptions[item.id] || "A mysterious guide."}</Text>
      {selectedGuideId === item.id && <Text style={styles.currentSelectionText}>Currently Selected</Text>}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{isFirstLaunch ? "Welcome! Choose Your AI Guide" : "Change Your AI Guide"}</Text>
      <Text style={styles.subHeader}>
        Your AI Guide will accompany you through your puzzle journey, offering unique feedback and encouragement.
      </Text>
      <FlatList
        data={guides}
        renderItem={renderGuideItem}
        keyExtractor={item => item.id}
        style={styles.list}
      />
      {!isFirstLaunch && (
          <View style={styles.doneButtonContainer}>
            <Button title="Done" onPress={() => navigation.goBack()} color={Colors.primary} />
          </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.large,
    paddingTop: Spacing.medium,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: FontSizes.title,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.small,
  },
  subHeader: {
    fontSize: FontSizes.large,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.medium,
  },
  list: {
    width: '100%',
  },
  guideButton: {
    backgroundColor: Colors.surface,
    padding: Spacing.large,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.medium,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  selectedGuideButton: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15', // Light tint
  },
  guideName: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  guideDescription: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    lineHeight: FontSizes.large * 1.4,
  },
  currentSelectionText: {
      fontSize: FontSizes.small,
      color: Colors.primary,
      fontWeight: 'bold',
      marginTop: Spacing.small,
      textAlign: 'right',
  },
  doneButtonContainer: {
      marginTop: Spacing.large,
      marginBottom: Spacing.xl,
  }
});

export default GuideSelectionScreen;
