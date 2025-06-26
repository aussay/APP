import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, ScrollView, ActivityIndicator, AppState as RNAppState, FlatList, SafeAreaView } from 'react-native';
import { linkUpArchive2025 } from './archive/2025';
import {
    getTodayLinkUpPuzzle, initializeLinkUpState, toggleItemSelection, submitGroup,
    isItemInFoundCategory, getLinkUpForDate, getLinkUpArchiveUpToDate,
    saveLinkUpState, loadLinkUpState // Added save/load
} from './logic';
import { LinkUpState, LinkUpItem, LinkUpPuzzle } from './types'; // Added LinkUpPuzzle
import { finalizeGameSession, loadStatistics, StatsUpdateResult, updateGameStreak } from '../../store/statisticsService';
import { GameKey } from '../../types/statistics';
import aiSimulatorInstance from '../../ai/AISimulator';
import { AITriggerType, AIResponse } from '../../ai/types';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../styles/theme';
import { checkAndUnlockAchievements, Achievement } from '../../store/achievementService';
import { useAchievementNotification } from '../../context/AchievementNotificationContext';
import { generateLinkUpShareMessage, shareGameResult } from '../../utils/sharingHelper';
import { getAttributionForDate } from '../../utils/game-attribution';

const LinkUpScreen: React.FC = () => {
  const currentPuzzleId = 'today_puzzle'; // Fixed ID for today's puzzle
  const defaultInitialState = initializeLinkUpState(getTodayLinkUpPuzzle());

  const [selectedArchiveIndex, setSelectedArchiveIndex] = useState<number | null>(null);
  const [currentPuzzle, setCurrentPuzzle] = useState(getTodayLinkUpPuzzle());
  const [gameState, setGameState] = useState<LinkUpState | null>(null);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [scoreFeedback, setScoreFeedback] = useState<string>('');
  const [lastActionStatus, setLastActionStatus] = useState<{ type: 'correct' | 'incorrect', itemIds: string[] } | null>(null);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [archiveVisible, setArchiveVisible] = useState(false);

  const gameStateRef = useRef(gameState);
  const [aiMessage, setAiMessage] = useState<AIResponse | null>(null);
  const [aiCrossGameSuggestion, setAiCrossGameSuggestion] = useState<AIResponse | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { showAchievementNotification } = useAchievementNotification();
  const appState = useRef(RNAppState.currentState);
  const isFocused = useIsFocused();

  const { puzzle, selectedItems, foundCategories, mistakesMade, maxMistakes, isGameOver, didWin, remainingItems } = gameState || defaultInitialState;
  const prevIsGameOver = useRef<boolean>(gameState ? gameState.isGameOver : false);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  useEffect(() => {
    const attemptLoadState = async () => {
      if (isFocused && currentPuzzle) { // Ensure currentPuzzle is defined
        setIsLoadingState(true);
        const puzzleIdToLoad = currentPuzzle.id || `date_${currentPuzzle.items.length}`; // Use currentPuzzle.id or a fallback
        const loadedState = await loadLinkUpState(puzzleIdToLoad, currentPuzzle);
        if (loadedState) {
          setGameState(loadedState);
          if (!loadedState.isGameOver) setGameStartTime(Date.now()); else setGameStartTime(null);
        } else {
          const newGame = initializeLinkUpState(currentPuzzle);
          setGameState(newGame); setGameStartTime(Date.now());
        }
        setIsLoadingState(false);
      }
    };
    attemptLoadState();
  }, [currentPuzzle, isFocused]); // Depend on currentPuzzle object

  useEffect(() => {
    // When archive selection changes, update the currentPuzzle state
    // This will then trigger the attemptLoadState effect above.
    if (selectedArchiveIndex !== null) {
      const archivePuzzleData = getLinkUpForDate(new Date(2025, 0, 1 + selectedArchiveIndex));
      if (archivePuzzleData) {
        setCurrentPuzzle(archivePuzzleData);
      }
    } else {
      // Default to today's puzzle if no archive is selected or on initial load
      setCurrentPuzzle(getTodayLinkUpPuzzle());
    }
  }, [selectedArchiveIndex]);

  useEffect(() => {
    if (isLoadingState || !gameState || !currentPuzzle) return; // Ensure currentPuzzle is defined
    const saveCurrentState = () => {
      if (gameState) {
        const puzzleIdToSave = currentPuzzle.id || `date_${currentPuzzle.items.length}`;
        // saveLinkUpState handles logic for not saving completed/empty states
        saveLinkUpState(puzzleIdToSave, gameState);
      }
    };
    const subscription = RNAppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {}
      else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        saveCurrentState();
      }
      appState.current = nextAppState;
    });
    return () => {
      subscription.remove();
      saveCurrentState();
    };
  }, [gameState, currentPuzzle, isLoadingState]);

  useEffect(() => {
    if (!gameState || isLoadingState) return;
    if (gameState.lastScoreChange !== 0) {
      setScoreFeedback(gameState.lastScoreChange > 0 ? `+${gameState.lastScoreChange}` : `${gameState.lastScoreChange}`);
      const timer = setTimeout(() => setScoreFeedback(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState?.lastScoreChange, gameState?.score, isLoadingState]);

  useEffect(() => {
    if (isLoadingState || !gameState) return;
    const availablePersonalities = ['connectionist', 'category_captain'];
    if (!aiSimulatorInstance.getActivePersonality() || !availablePersonalities.includes(aiSimulatorInstance.getActivePersonality()!.id) ) {
        aiSimulatorInstance.setActivePersonality(availablePersonalities[Math.floor(Math.random() * availablePersonalities.length)]);
    }
    if(gameState.foundCategories.length === 0 && gameState.mistakesMade === 0) {
        const initialResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.LINK_UP, triggerType: AITriggerType.GAME_START });
        setAiMessage(initialResponse);
    }
    setAiCrossGameSuggestion(null);
  }, [isLoadingState, gameState]);

  const handleItemPress = (item: LinkUpItem) => {
    if (!gameState || isItemInFoundCategory(item, gameState.foundCategories) || gameState.isGameOver) return;
    setGameState(prev => prev ? toggleItemSelection(prev, item) : null);
  };

  const handleSubmitGroup = () => {
    if (!gameState || gameState.selectedItems.length !== gameState.puzzle.itemsPerGroup) return;
    const currentSelectedIds = gameState.selectedItems.map(item => item.id);
    setGameState(prev => {
      if (!prev) return null;
      const newState = submitGroup(prev);
      const justFoundCategory = newState.foundCategories.find(fc => fc.items.some(i => currentSelectedIds.includes(i.id) && !prev.foundCategories.some(pfc => pfc.categoryId === fc.categoryId)));
      if (justFoundCategory) {
          setLastActionStatus({ type: 'correct', itemIds: currentSelectedIds }); setTimeout(() => setLastActionStatus(null), 700);
          const correctResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.LINK_UP, triggerType: AITriggerType.CORRECT_ACTION, currentScore: newState.score });
          setAiMessage(correctResponse); setAiCrossGameSuggestion(null);
      } else if (newState.mistakesMade > prev.mistakesMade) {
          setLastActionStatus({ type: 'incorrect', itemIds: currentSelectedIds }); setTimeout(() => setLastActionStatus(null), 700);
          const incorrectResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.LINK_UP, triggerType: AITriggerType.INCORRECT_ACTION, mistakesMade: newState.mistakesMade });
          setAiMessage(incorrectResponse); setAiCrossGameSuggestion(null);
      }
      if (newState.isGameOver && !prev.isGameOver) {
        const solveTime = newState.didWin && gameStartTime ? (Date.now() - gameStartTime) / 1000 : undefined;
        finalizeGameSession(GameKey.LINK_UP, newState.didWin, solveTime)
          .then((statsResult: StatsUpdateResult) => {
              if (statsResult.unlockedAchievements) statsResult.unlockedAchievements.forEach(ach => showAchievementNotification(ach));
              // Per-game streak update for daily
              if (newState.didWin && newState.isDailyChallenge) {
                  updateGameStreak(GameKey.LINK_UP).then(() => {/* Optionally handle per-game streak achievements */});
              }
              // Specific check for "Perfect Linker" if game was won with 0 mistakes
              if (newState.didWin && newState.mistakesMade === 0) {
                  loadStatistics().then(async currentGlobalStats => { // load fresh stats to pass to check
                     const perfectGameUnlock = await checkAndUnlockAchievements(currentGlobalStats, GameKey.LINK_UP, { didWin: true, mistakesMade: 0, solveTimeInSeconds: solveTime });
                     perfectGameUnlock.forEach(ach => showAchievementNotification(ach));
                  });
              }
          }).catch(err => console.error('Error finalizing Link Up session or checking achievements:', err));
        const endResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.LINK_UP, triggerType: newState.didWin ? AITriggerType.GAME_WIN : AITriggerType.GAME_LOSE, currentScore: newState.score });
        setAiMessage(endResponse);
        setTimeout(() => { const suggestionResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.LINK_UP, triggerType: AITriggerType.CROSS_GAME_SUGGESTION }); setAiCrossGameSuggestion(suggestionResponse);}, 1500);
      }
      return newState;
    });
  };

  useEffect(() => {
    if (!gameState || isLoadingState) return;
    const currentIsGameOver = gameState.isGameOver;
    if (currentIsGameOver && !prevIsGameOver.current) { // Game just ended
        if (!gameState.didWin) { // If lost (e.g. max mistakes)
             finalizeGameSession(GameKey.LINK_UP, false, undefined)
                .then((statsResult: StatsUpdateResult) => {
                    if (statsResult.unlockedAchievements) statsResult.unlockedAchievements.forEach(ach => showAchievementNotification(ach));
                }).catch(err => console.error('Error updating Link Up stats (max mistakes):', err));
            const endResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.LINK_UP, triggerType: AITriggerType.GAME_LOSE, currentScore: gameState.score });
            setAiMessage(endResponse); setAiCrossGameSuggestion(null);
            setTimeout(() => { const suggestionResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.LINK_UP, triggerType: AITriggerType.CROSS_GAME_SUGGESTION }); setAiCrossGameSuggestion(suggestionResponse);}, 1500);
        }
    }
    prevIsGameOver.current = currentIsGameOver;
  }, [gameState?.isGameOver, gameState?.didWin, gameState?.score, isLoadingState, showAchievementNotification, gameStartTime]);

  const getCategoryStyle = (categoryIndex: number) => { const themeCategoryColors = [Colors.primary, Colors.secondary, Colors.accent, Colors.success]; return { backgroundColor: themeCategoryColors[categoryIndex % themeCategoryColors.length] + '30' }; };
  const handleSuggestionNavigation = (suggestedGameText: string) => { const SuggMap: {[key:string]: keyof RootStackParamList | undefined} = { "puzzle grid": "PuzzleGrid", "letter logic": "LetterLogic" }; let navTo: keyof RootStackParamList | undefined; for (const key in SuggMap) { if(suggestedGameText.toLowerCase().includes(key)) navTo = SuggMap[key]; } if (navTo) navigation.navigate(navTo as any); else console.warn("Cannot navigate to suggested game:", suggestedGameText); setAiCrossGameSuggestion(null); };
  const handleShareResult = () => { if (!gameState) return; const shareData = generateLinkUpShareMessage(gameState.foundCategories.length, gameState.puzzle.categories.length, gameState.mistakesMade, gameState.didWin); shareGameResult(shareData); };

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const { writer, editor } = getAttributionForDate(dateStr);

  const archiveList = linkUpArchive2025;
  const isUnlocked = (index: number) => {
    const today = new Date();
    const archiveDate = new Date(2025, 0, 1 + index);
    return archiveDate <= today;
  };

  if (isLoadingState || !gameState) { return (<View style={[styles.container, styles.centeredLoading]}><ActivityIndicator size="large" color={Colors.primary} /><Text style={styles.loadingText}>Loading Game...</Text></View>); }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Attribution Banner */}
      <View style={{ padding: 12, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#007AFF' }}>By {writer}</Text>
        <Text style={{ fontSize: 13, color: '#888' }}>Edited by {editor}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Link Up</Text>
        <Text style={styles.instructions}>Find groups of {puzzle.itemsPerGroup} related items.</Text>
        <Text style={styles.mistakes}>Mistakes: {mistakesMade} / {maxMistakes}</Text>
        {aiMessage && !aiCrossGameSuggestion && (<View style={styles.aiMessageContainer}><Text style={styles.aiPersonality}>{aiSimulatorInstance.getActivePersonality()?.name || 'AI'}:</Text><Text style={styles.aiMessageText}>{aiMessage.text}</Text></View>)}
        {aiCrossGameSuggestion && isGameOver && (<View style={[styles.aiMessageContainer, styles.suggestionContainer]}><Text style={styles.aiPersonality}>{aiSimulatorInstance.getActivePersonality()?.name || 'AI'} suggests:</Text><Text style={styles.aiMessageText}>{aiCrossGameSuggestion.text}</Text><Button title={`Let's try it!`} onPress={() => handleSuggestionNavigation(aiCrossGameSuggestion.text)} color={Colors.accent}/></View>)}
        {isGameOver && (<View style={styles.gameOverContainer}><Text style={didWin ? styles.winText : styles.loseText}>{didWin ? 'Congratulations! You found all groups!' : 'Game Over! Too many mistakes.'}</Text><View style={styles.gameOverActions}><Button title="Play Again" onPress={() => { setGameState(initializeLinkUpState(getTodayLinkUpPuzzle())); setScoreFeedback(''); setLastActionStatus(null); setAiCrossGameSuggestion(null); setGameStartTime(Date.now()); const initialResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.LINK_UP, triggerType: AITriggerType.GAME_START }); setAiMessage(initialResponse);}} color={Colors.primary} /><View style={{width: Spacing.medium}} /><Button title="Share Result" onPress={handleShareResult} color={Colors.secondary} /></View></View>)}
        {foundCategories.map((categoryGroup, index) => ( <View key={categoryGroup.categoryId} style={[styles.foundCategory, getCategoryStyle(index)]}><Text style={styles.categoryName}>{puzzle.categories.find(c=>c.id === categoryGroup.categoryId)?.name}</Text><View style={styles.itemsGrid}>{categoryGroup.items.map(item => ( <View key={item.id} style={[styles.item, styles.foundItem]}><Text style={styles.itemText}>{item.text}</Text></View> ))}</View></View> ))}
        {!isGameOver && (<View style={styles.itemsGrid}>{remainingItems.map(item => { const isSelected = selectedItems.some(si => si.id === item.id); let dynamicStyle = {}; if (lastActionStatus && lastActionStatus.itemIds.includes(item.id)) dynamicStyle = lastActionStatus.type === 'correct' ? styles.correctActionItem : styles.incorrectActionItem; return ( <TouchableOpacity key={item.id} style={[ styles.item, isSelected ? styles.selectedItem : {}, dynamicStyle ]} onPress={() => handleItemPress(item)} disabled={isGameOver}><Text style={styles.itemText}>{item.text}</Text></TouchableOpacity> ); })}</View>)}
        {!isGameOver && selectedItems.length === puzzle.itemsPerGroup && ( <View style={styles.buttonWrapper}><Button title="Submit Group" onPress={handleSubmitGroup} color={Colors.primary} /></View> )}
        {!isGameOver && selectedItems.length > 0 && selectedItems.length < puzzle.itemsPerGroup && ( <View style={styles.buttonWrapper}><Button title="Deselect All" onPress={() => setGameState(prev => prev ? {...prev, selectedItems: []} : null)} color={Colors.textSecondary}/></View> )}
        <View style={{ margin: 10 }}>
          <Button title={archiveVisible ? "Hide Archive" : "Show Archive"} onPress={() => setArchiveVisible(v => !v)} color={Colors.secondary} />
        </View>
        {archiveVisible && (
          <FlatList
            data={archiveList}
            keyExtractor={(item, idx) => `lu_${idx}`}
            renderItem={({ item, index }) => {
              const unlocked = isUnlocked(index);
              return (
                <TouchableOpacity
                  onPress={() => { if (unlocked) { setSelectedArchiveIndex(index); setArchiveVisible(false); } }}
                  disabled={!unlocked}
                  style={{ opacity: unlocked ? 1 : 0.4 }}
                >
                  <Text style={{ color: unlocked ? Colors.primary : Colors.disabled, padding: 8 }}>
                    {`Link Up - ${(new Date(2025, 0, 1 + index)).toDateString()} ${unlocked ? '' : '(Locked)'}`}
                  </Text>
                </TouchableOpacity>
              );
            }}
            style={{ maxHeight: 200, backgroundColor: Colors.surface, borderRadius: 8, marginBottom: 10 }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: Spacing.medium, backgroundColor: Colors.background },
  centeredLoading: { flex:1, justifyContent: 'center', alignItems: 'center'},
  loadingText: { marginTop: Spacing.medium, fontSize: FontSizes.large, color: Colors.textSecondary },
  title: { fontSize: FontSizes.xxl, fontWeight: 'bold', marginBottom: Spacing.small, color: Colors.textPrimary },
  instructions: { fontSize: FontSizes.large, marginBottom: Spacing.medium, textAlign: 'center', color: Colors.textSecondary },
  mistakes: { fontSize: FontSizes.large, color: Colors.error, marginBottom: Spacing.small },
  scoreContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.medium },
  scoreText: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.textPrimary },
  scoreFeedbackText: { fontSize: FontSizes.large, marginLeft: Spacing.small, fontWeight: 'bold', color: Colors.success },
  scoreFeedbackNegative: { color: Colors.error },
  aiMessageContainer: { marginTop: Spacing.small, marginBottom: Spacing.medium, padding: Spacing.medium, backgroundColor: Colors.surface, borderRadius: BorderRadius.medium, width: '95%', alignSelf: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  suggestionContainer: { backgroundColor: Colors.secondary + '20', borderColor: Colors.secondary },
  aiPersonality: { fontWeight: 'bold', fontSize: FontSizes.large, color: Colors.textPrimary },
  aiMessageText: { fontSize: FontSizes.medium, textAlign: 'center', fontStyle: 'italic', marginBottom: Spacing.small, color: Colors.textSecondary },
  itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: Spacing.large, width: '100%' },
  item: { width: '46%', paddingVertical: Spacing.large, margin: '2%', borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.medium, justifyContent: 'center', alignItems: 'center', minHeight: 80, backgroundColor: Colors.surface, elevation: 1 },
  itemText: { fontSize: FontSizes.large, textAlign: 'center', color: Colors.textPrimary },
  selectedItem: { backgroundColor: Colors.primary + '30', borderColor: Colors.primary, elevation: 3 },
  correctActionItem: { backgroundColor: Colors.success + '30', borderColor: Colors.success },
  incorrectActionItem: { backgroundColor: Colors.error + '30', borderColor: Colors.error },
  foundItem: { backgroundColor: Colors.disabled + '40', borderColor: Colors.disabled, elevation: 0 },
  foundCategory: { width: '95%', marginBottom: Spacing.medium, padding: Spacing.medium, borderRadius: BorderRadius.medium, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  categoryName: { fontSize: FontSizes.xl, fontWeight: '600', marginBottom: Spacing.small, color: Colors.textPrimary },
  gameOverContainer: { alignItems: 'center', marginVertical: Spacing.large },
  gameOverActions: { flexDirection: 'row', justifyContent: 'space-around', width: '90%', marginTop: Spacing.small },
  winText: { fontSize: FontSizes.xl, color: Colors.success, marginBottom: Spacing.medium, textAlign: 'center', fontWeight: 'bold' },
  loseText: { fontSize: FontSizes.xl, color: Colors.error, marginBottom: Spacing.medium, textAlign: 'center', fontWeight: 'bold' },
  buttonWrapper: { width: '80%', marginVertical: Spacing.small }
});

export default LinkUpScreen;
